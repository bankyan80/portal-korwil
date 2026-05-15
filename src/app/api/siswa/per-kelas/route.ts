import { NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';

export interface PerKelasSekolah {
  name: string;
  jenjang: string;
  perKelas: Record<string, { l: number; p: number }>;
  totalL: number;
  totalP: number;
}

export async function GET() {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ data: null, source: 'mock' });
  }

  try {
    // Helper to add student to sekolahMap
    function addToMap(sekolahMap: Map<string, PerKelasSekolah>, name: string, jenjang: string, kelas: string, jk: string) {
      const key = `${name}||${jenjang}`;
      if (!sekolahMap.has(key)) {
        sekolahMap.set(key, { name, jenjang, perKelas: {}, totalL: 0, totalP: 0 });
      }
      const entry = sekolahMap.get(key)!;
      if (!entry.perKelas[kelas]) entry.perKelas[kelas] = { l: 0, p: 0 };
      if (jk === 'L') { entry.perKelas[kelas].l++; entry.totalL++; }
      else { entry.perKelas[kelas].p++; entry.totalP++; }
    }

    // Infer SD grade from birth year (rough estimate for students without kelas data)
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

    // 1) Try data_pd_siswa (admin-managed, has kelas field)
    const snapPd = await adminDb.collection('data_pd_siswa').where('status', '!=', 'lulus').get();
    for (const doc of snapPd.docs) {
      const s = doc.data();
      if (!s.sekolah) continue;
      const jenjang = s.jenjang || 'SD';
      const kelas = jenjang === 'TK' ? (s.kelas ? String(s.kelas) : 'A') : (s.kelas ? String(s.kelas) : '-');
      const kelasKey = jenjang === 'TK' && !['A', 'B'].includes(kelas) ? 'A' : kelas;
      addToMap(sekolahMap, s.sekolah, jenjang, kelasKey, s.jk || 'L');
    }

    // 2) For schools not yet in the map, try siswa collection (synced Dapodik, no kelas field)
    const snapSiswa = await adminDb.collection('siswa').get();
    for (const doc of snapSiswa.docs) {
      const s = doc.data() as { sekolah?: string; jenjang?: string; jk?: string; tanggal_lahir?: string };
      if (!s.sekolah) continue;
      const jenjang = s.jenjang || 'SD';
      const key = `${s.sekolah}||${jenjang}`;
      if (sekolahMap.has(key)) continue;
      const kelas = jenjang !== 'SD' ? 'A' : inferKelas(s.tanggal_lahir);
      addToMap(sekolahMap, s.sekolah, jenjang, kelas, s.jk || 'L');
    }

    // 3) Also include students collection (admin-managed via ManageDataPd)
    const snapStudents = await adminDb.collection('students').get();
    for (const doc of snapStudents.docs) {
      const s = doc.data() as { sekolah?: string; jenjang?: string; jk?: string; kelas?: number };
      if (!s.sekolah || s.status === 'lulus') continue;
      const jenjang = s.jenjang || 'SD';
      const key = `${s.sekolah}||${jenjang}`;
      if (sekolahMap.has(key)) continue;
      const kelas = s.kelas ? String(s.kelas) : (jenjang !== 'SD' ? 'A' : '1');
      addToMap(sekolahMap, s.sekolah, jenjang, kelas, s.jk || 'L');
    }

    const data = Array.from(sekolahMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ data, source: 'firestore' });
  } catch (error) {
    console.error('Gagal mengambil data per-kelas:', error);
    return NextResponse.json({ data: null, source: 'error' });
  }
}
