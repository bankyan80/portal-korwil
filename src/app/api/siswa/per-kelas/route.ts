import { NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { normalizeKelas } from '@/lib/normalize';
import fs from 'fs';
import path from 'path';

export interface PerKelasSekolah {
  name: string;
  jenjang: string;
  perKelas: Record<string, { l: number; p: number }>;
  totalL: number;
  totalP: number;
}

function loadStaticSiswa() {
  const p = path.join(process.cwd(), 'src', 'data', 'data-siswa.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function buildFromStatic(): PerKelasSekolah[] {
  const siswa = loadStaticSiswa();
  const map = new Map<string, PerKelasSekolah>();

  for (const s of siswa) {
    const name = s.sekolah;
    const jenjang = s.jenjang || 'SD';
    if (!name) continue;
    const key = `${name}||${jenjang}`;
    if (!map.has(key)) {
      map.set(key, { name, jenjang, perKelas: {}, totalL: 0, totalP: 0 });
    }
    const entry = map.get(key)!;
    const rawKelas = s.kelas ? String(s.kelas) : (s.rombel || '-');
    const kelas = normalizeKelas(rawKelas, jenjang);
    if (!entry.perKelas[kelas]) entry.perKelas[kelas] = { l: 0, p: 0 };
    if (s.jk === 'L') { entry.perKelas[kelas].l++; entry.totalL++; }
    else { entry.perKelas[kelas].p++; entry.totalP++; }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function GET() {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ data: buildFromStatic(), source: 'static' });
  }

  try {
    function addToMap(sekolahMap: Map<string, PerKelasSekolah>, name: string, jenjang: string, rawKelas: string, jk: string) {
      const key = `${name}||${jenjang}`;
      if (!sekolahMap.has(key)) {
        sekolahMap.set(key, { name, jenjang, perKelas: {}, totalL: 0, totalP: 0 });
      }
      const entry = sekolahMap.get(key)!;
      const kelas = normalizeKelas(rawKelas, jenjang);
      if (!entry.perKelas[kelas]) entry.perKelas[kelas] = { l: 0, p: 0 };
      if (jk === 'L') { entry.perKelas[kelas].l++; entry.totalL++; }
      else { entry.perKelas[kelas].p++; entry.totalP++; }
    }

    function inferKelas(tanggalLahir: string | undefined): string {
      if (!tanggalLahir) return '1';
      const year = parseInt(tanggalLahir.substring(0, 4), 10);
      if (isNaN(year)) return '1';
      const age = new Date().getFullYear() - year;
      let grade = age - 6;
      if (grade < 1) grade = 1;
      if (grade > 6) grade = 6;
      return String(grade);
    }

    const sekolahMap = new Map<string, PerKelasSekolah>();

    // Prioritas UTAMA: Koleksi 'students'
    const snapStudents = await adminDb.collection('students').get();
    for (const doc of snapStudents.docs) {
      const s = doc.data() as { sekolah?: string; jenjang?: string; jk?: string; kelas?: number; status?: string };
      if (!s.sekolah || s.status === 'lulus') continue;
      const jenjang = s.jenjang || 'SD';
      const rawKelas = s.kelas ? String(s.kelas) : (jenjang !== 'SD' ? 'A' : '1');
      addToMap(sekolahMap, s.sekolah, jenjang, rawKelas, s.jk || 'L');
    }

    // Hanya jika 'students' kosong, fallback ke koleksi lama (untuk masa transisi)
    if (sekolahMap.size === 0) {
      console.log('[Firestore] Collection students empty, falling back to legacy collections');
      const snapSiswa = await adminDb.collection('siswa').limit(500).get();
      for (const doc of snapSiswa.docs) {
        const s = doc.data() as { sekolah?: string; jenjang?: string; jk?: string; tanggal_lahir?: string; kelas?: string };
        if (!s.sekolah) continue;
        const jenjang = s.jenjang || 'SD';
        const rawKelas = s.kelas ? String(s.kelas) : (jenjang !== 'SD' ? 'A' : inferKelas(s.tanggal_lahir));
        addToMap(sekolahMap, s.sekolah, jenjang, rawKelas, s.jk || 'L');
      }
    }

    const data = Array.from(sekolahMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ data, source: 'firestore' });
  } catch (error) {
    console.error('Gagal mengambil data per-kelas:', error);
    return NextResponse.json({ data: buildFromStatic(), source: 'static' });
  }
}
