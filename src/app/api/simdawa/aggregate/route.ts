import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import siswaData from '@/data/data-siswa.json';

const OVERLAY_PATH = path.join(process.cwd(), 'src', 'data', 'overlay-siswa.json');

function readOverlay(): any[] {
  try {
    if (!fs.existsSync(OVERLAY_PATH)) return [];
    return JSON.parse(fs.readFileSync(OVERLAY_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function toNumber(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getKelasKey(jenjang: string, kelas: any): string {
  const k = Number(kelas);
  if (jenjang === 'SD') return Number.isFinite(k) && k >= 1 && k <= 6 ? `kelas_${k}` : 'kelas_lain';
  return String(kelas || '');
}

const TAHUN_PELAJARAN = '2026/2027';

export async function GET() {
  try {
    const overlay = readOverlay();
    const overlayDeleted = new Set(overlay.filter((r: any) => r.deleted).map((r: any) => r.nik));

    const allSiswa = (siswaData as any[]).filter((s: any) => !overlayDeleted.has(s.nik));

    const overlayByNik = new Map(overlay.filter((r: any) => !r.deleted && r.status !== 'lulus').map((r: any) => [r.nik, r]));
    const merged = allSiswa.map((s: any) => {
      const ov = overlayByNik.get(s.nik);
      return ov ? { ...s, ...ov } : s;
    });
    for (const ov of overlayByNik.values()) {
      if (!merged.some((m: any) => m.nik === ov.nik)) {
        merged.push(ov);
      }
    }

    const alumniOverlay = overlay.filter((r: any) => !r.deleted && r.status === 'lulus');
    const alumniBySekolah: Record<string, number> = {};
    for (const a of alumniOverlay) {
      const key = `${a.sekolah || ''}||${a.jenjang || 'SD'}`;
      alumniBySekolah[key] = (alumniBySekolah[key] || 0) + 1;
    }

    const groups: Record<string, {
      nama_sekolah: string;
      jenjang: string;
      npsn: string;
      siswa: any[];
      rombelSet: Set<string>;
    }> = {};

    for (const s of merged) {
      const sekolah = s.sekolah || '';
      const jenjang = ['SD', 'TK', 'KB'].includes(s.jenjang) ? s.jenjang : 'SD';
      const key = `${sekolah}||${jenjang}`;
      if (!groups[key]) {
        groups[key] = { nama_sekolah: sekolah, jenjang, npsn: s.npsn || '', siswa: [], rombelSet: new Set() };
      }
      groups[key].siswa.push(s);
      if (s.rombel) groups[key].rombelSet.add(String(s.rombel));
    }

    const data = Object.values(groups).map(g => {
      const siswa = g.siswa;
      let kelas_1_l = 0, kelas_1_p = 0, kelas_2_l = 0, kelas_2_p = 0,
        kelas_3_l = 0, kelas_3_p = 0, kelas_4_l = 0, kelas_4_p = 0,
        kelas_5_l = 0, kelas_5_p = 0, kelas_6_l = 0, kelas_6_p = 0;
      let kelompok_a_l = 0, kelompok_a_p = 0, kelompok_b_l = 0, kelompok_b_p = 0;
      let kb_a_l = 0, kb_a_p = 0, kb_b_l = 0, kb_b_p = 0;
      let laki = 0, perempuan = 0, siswaBaru = 0;

      for (const s of siswa) {
        const jk = s.jk || 'L';
        if (jk === 'L') laki++; else perempuan++;
        const kelas = s.kelas;

        if (g.jenjang === 'SD') {
          const k = Number(kelas);
          if (k === 1) { if (jk === 'L') kelas_1_l++; else kelas_1_p++; siswaBaru++; }
          else if (k === 2) { if (jk === 'L') kelas_2_l++; else kelas_2_p++; }
          else if (k === 3) { if (jk === 'L') kelas_3_l++; else kelas_3_p++; }
          else if (k === 4) { if (jk === 'L') kelas_4_l++; else kelas_4_p++; }
          else if (k === 5) { if (jk === 'L') kelas_5_l++; else kelas_5_p++; }
          else if (k === 6) { if (jk === 'L') kelas_6_l++; else kelas_6_p++; }
          else { if (jk === 'L') kelas_1_l++; else kelas_1_p++; }
        } else if (g.jenjang === 'TK') {
          const k = String(kelas || '');
          if (['B', '2', '3', 'C'].includes(k)) {
            if (jk === 'L') kelompok_b_l++; else kelompok_b_p++;
          } else if (['A', '1'].includes(k)) {
            if (jk === 'L') kelompok_a_l++; else kelompok_a_p++;
            siswaBaru++;
          } else {
            if (jk === 'L') kelompok_a_l++; else kelompok_a_p++;
          }
        } else if (g.jenjang === 'KB') {
          const k = String(kelas || '');
          if (['B', '2', '3', 'C'].includes(k)) {
            if (jk === 'L') kb_b_l++; else kb_b_p++;
          } else if (['A', '1'].includes(k)) {
            if (jk === 'L') kb_a_l++; else kb_a_p++;
            siswaBaru++;
          } else {
            if (jk === 'L') kb_a_l++; else kb_a_p++;
          }
        }
      }

      const totalL = kelas_1_l + kelas_2_l + kelas_3_l + kelas_4_l + kelas_5_l + kelas_6_l + kelompok_a_l + kelompok_b_l + kb_a_l + kb_b_l;
      const totalP = kelas_1_p + kelas_2_p + kelas_3_p + kelas_4_p + kelas_5_p + kelas_6_p + kelompok_a_p + kelompok_b_p + kb_a_p + kb_b_p;
      const key = `${g.nama_sekolah}||${g.jenjang}`;
      const alumni = alumniBySekolah[key] || 0;

      return {
        tahun_pelajaran: TAHUN_PELAJARAN,
        jenjang: g.jenjang,
        nama_sekolah: g.nama_sekolah,
        npsn: g.npsn,
        rombel: g.rombelSet.size || 1,
        laki_laki: laki,
        perempuan,
        total_siswa: laki + perempuan,
        siswa_baru: siswaBaru,
        mutasi_masuk: 0,
        mutasi_keluar: 0,
        alumni,
        terakhir_update: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' }),
        kelas_1_l, kelas_1_p, kelas_2_l, kelas_2_p,
        kelas_3_l, kelas_3_p, kelas_4_l, kelas_4_p,
        kelas_5_l, kelas_5_p, kelas_6_l, kelas_6_p,
        kelompok_a_l, kelompok_a_p, kelompok_b_l, kelompok_b_p,
        kb_a_l, kb_a_p, kb_b_l, kb_b_p,
        usia_2_3_l: 0, usia_2_3_p: 0, usia_3_4_l: 0, usia_3_4_p: 0, usia_5_6_l: 0, usia_5_6_p: 0,
      };
    });

    data.sort((a, b) => {
      const order = ['SD', 'TK', 'KB'];
      const ja = order.indexOf(a.jenjang);
      const jb = order.indexOf(b.jenjang);
      if (ja !== jb) return ja - jb;
      return a.nama_sekolah.localeCompare(b.nama_sekolah);
    });

    return NextResponse.json({
      success: true,
      updated_at: new Date().toISOString(),
      data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message || 'Gagal mengagregasi data',
      data: [],
    }, { status: 500 });
  }
}
