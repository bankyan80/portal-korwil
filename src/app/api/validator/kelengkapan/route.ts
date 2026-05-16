import { NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

interface BaseSekolah {
  nama: string;
  npsn: string;
  jenjang: string;
  desa: string;
  status: string;
}

interface CompletenessItem {
  ada: boolean;
  total: number;
  fieldsFilled?: number;
  totalFields?: number;
  message: string;
}

export interface SchoolCompleteness {
  npsn: string;
  nama: string;
  jenjang: string;
  desa: string;
  status: string;
  siswa: CompletenessItem;
  pegawai: CompletenessItem;
  sarpras: CompletenessItem;
  laporan: CompletenessItem;
  profil: CompletenessItem;
  skor: number;
}

const SARPRAS_FIELDS = [
  'ruang_kelas','perpustakaan','uks','toilet','mushola','gudang','ruang_guru',
  'ruang_kepala_sekolah','rumah_dinas_kepsek','tanah_pemerintah','tanah_yayasan',
  'tanah_perseorangan','bangku','meja_murid','kursi_murid','kursi_guru','meja_guru',
  'lemari','papan_tulis','kursi_tamu','rak_buku','sumber_air','menyewa_per_bulan',
  'menumpang_di_sd','bangunan_sekolah_p','bangunan_sekolah_sp','bangunan_sekolah_dr',
  'r_dinas_kepsek_p','r_dinas_kepsek_sp','r_dinas_kepsek_dr','r_dinas_guru_p',
  'r_dinas_guru_sp','r_dinas_guru_dr','perpustakaan_p','perpustakaan_sp','perpustakaan_dr',
];

function loadSchools(): BaseSekolah[] {
  const p = path.join(process.cwd(), 'src', 'data', 'sekolah.ts');
  const raw = fs.readFileSync(p, 'utf-8');
  const sekolahSD: BaseSekolah[] = [];
  const sekolahTK: BaseSekolah[] = [];
  const sekolahKB: BaseSekolah[] = [];

  const namaMatch = raw.matchAll(/nama:\s*'([^']+)'/g);
  const npsnMatch = raw.matchAll(/npsn:\s*'([^']+)'/g);
  const jenjangMatch = raw.matchAll(/jenjang:\s*'([^']+)'/g);
  const desaMatch = raw.matchAll(/desa:\s*'([^']+)'/g);
  const statusMatch = raw.matchAll(/status:\s*'([^']+)'/g);

  const names = [...namaMatch].map(m => m[1]);
  const npsns = [...npsnMatch].map(m => m[1]);
  const jenjangs = [...jenjangMatch].map(m => m[1]);
  const desas = [...desaMatch].map(m => m[1]);
  const statuss = [...statusMatch].map(m => m[1]);

  return names.map((nama, i) => ({
    nama,
    npsn: npsns[i] || '',
    jenjang: jenjangs[i] || 'SD',
    desa: desas[i] || '',
    status: statuss[i] || 'NEGERI',
  }));
}

export async function GET() {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ success: false, error: 'Firebase Admin tidak dikonfigurasi' }, { status: 500 });
  }

  try {
    const schools = loadSchools();
    const results: SchoolCompleteness[] = [];

    const [siswaSnap, pegawaiSnap, sarprasSnap, laporanSnap, sekolahSnap] = await Promise.all([
      adminDb.collection('students').get(),
      adminDb.collection('employees').get(),
      adminDb.collection('sarpras').get(),
      adminDb.collection('laporan_bulanan').get(),
      adminDb.collection('schools').get(),
    ]);

    const siswaDocs = siswaSnap.docs.map(d => d.data());
    const pegawaiDocs = pegawaiSnap.docs.map(d => d.data());
    const sarprasDocs = new Map(sarprasSnap.docs.map(d => [d.id, d.data()]));
    const laporanDocs = laporanSnap.docs.map(d => d.data());
    const sekolahDocs = new Map(sekolahSnap.docs.map(d => [d.id, d.data()]));

    for (const school of schools) {
      const npsn = school.npsn;
      const schoolName = school.nama;
      const normalized = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '');

      const sekolahFirestore = sekolahDocs.get(npsn) || sekolahDocs.get(schoolName);

      const siswaSchool = siswaDocs.filter((s: any) => {
        const sName = (s.sekolah || s.schoolName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return sName === normalized || s.schoolId === npsn;
      });
      const siswaAda = siswaSchool.length > 0;
      const siswaTotal = siswaSchool.length;

      const pegawaiSchool = pegawaiDocs.filter((p: any) => {
        const pName = (p.sekolah || p.schoolName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return pName === normalized || p.schoolId === npsn;
      });
      const pegawaiAda = pegawaiSchool.length > 0;
      const pegawaiTotal = pegawaiSchool.length;

      const sarprasData = sarprasDocs.get(npsn);
      const sarprasFilled = SARPRAS_FIELDS.filter(k => {
        const v = sarprasData?.[k];
        return v !== undefined && v !== '' && v !== null && v !== '-';
      }).length;
      const sarprasAda = sarprasFilled > 0;

      const laporanSchool = laporanDocs.filter((l: any) => l.sekolahId === npsn || l.sekolah === schoolName);
      const laporanAda = laporanSchool.length > 0;
      const laporanTotal = laporanSchool.length;

      const profilAda = !!sekolahFirestore && !!sekolahFirestore.npsn && sekolahFirestore.npsn !== '-';

      const skorRaw = [siswaAda, pegawaiAda, sarprasAda, laporanAda, profilAda].filter(Boolean).length;
      const skor = Math.round((skorRaw / 5) * 100);

      results.push({
        npsn,
        nama: schoolName,
        jenjang: school.jenjang,
        desa: school.desa,
        status: school.status,
        siswa: { ada: siswaAda, total: siswaTotal, message: siswaAda ? `${siswaTotal} siswa` : 'Belum ada data siswa' },
        pegawai: { ada: pegawaiAda, total: pegawaiTotal, message: pegawaiAda ? `${pegawaiTotal} pegawai` : 'Belum ada data pegawai' },
        sarpras: { ada: sarprasAda, fieldsFilled: sarprasFilled, totalFields: SARPRAS_FIELDS.length, message: sarprasAda ? `${sarprasFilled}/${SARPRAS_FIELDS.length} field terisi` : 'Belum ada data sarpras' },
        laporan: { ada: laporanAda, total: laporanTotal, message: laporanAda ? `${laporanTotal} laporan` : 'Belum ada laporan' },
        profil: { ada: profilAda, message: profilAda ? 'Profil lengkap' : 'Profil belum diisi' },
        skor,
      });
    }

    results.sort((a, b) => a.skor - b.skor);

    const ringkasan = {
      total: schools.length,
      lengkap: results.filter(r => r.skor === 100).length,
      kurang: results.filter(r => r.skor > 0 && r.skor < 100).length,
      kosong: results.filter(r => r.skor === 0).length,
      rataSkor: Math.round(results.reduce((sum, r) => sum + r.skor, 0) / results.length),
    };

    return NextResponse.json({ success: true, schools: results, ringkasan });
  } catch (error) {
    console.error('Validator error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
