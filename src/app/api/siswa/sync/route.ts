import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';

interface DataOrangTua {
  nama: string;
  tahun_lahir: string;
  pendidikan: string;
  pekerjaan: string;
  penghasilan: string;
  nik: string;
}

interface Siswa {
  nik: string;
  nama: string;
  nipd?: string;
  jk: string;
  nisn: string;
  tempat_lahir?: string;
  tanggal_lahir: string;
  agama?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  dusun?: string;
  desa: string;
  kecamatan?: string;
  kode_pos?: string;
  jenis_tinggal?: string;
  alat_transportasi?: string;
  telepon?: string;
  hp?: string;
  email?: string;
  skhun?: string;
  penerima_kps?: string;
  no_kps?: string;
  data_ayah?: DataOrangTua | null;
  data_ibu?: DataOrangTua | null;
  data_wali?: DataOrangTua | null;
  rombel?: string;
  kelas?: number | null;
  no_peserta_ujian?: string;
  no_seri_ijazah?: string;
  penerima_kip?: string;
  nomor_kip?: string;
  nama_di_kip?: string;
  nomor_kks?: string;
  no_reg_akta_lahir?: string;
  bank?: string;
  nomor_rekening?: string;
  rekening_atas_nama?: string;
  layak_pip: string;
  alasan_layak_pip?: string;
  kebutuhan_khusus?: string;
  sekolah_asal?: string;
  anak_ke?: number | null;
  lintang?: number | null;
  bujur?: number | null;
  no_kk?: string;
  berat_badan?: number | null;
  tinggi_badan?: number | null;
  lingkar_kepala?: number | null;
  jumlah_saudara?: number | null;
  jarak_rumah_km?: number | null;
  sekolah: string;
  jenjang: string;
}

function loadData(): Siswa[] {
  const p = path.join(process.cwd(), 'src', 'data', 'data-siswa.json');
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw);
}

export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json(
      { success: false, error: 'Firebase Admin tidak dikonfigurasi' },
      { status: 500 }
    );
  }

  // Verify auth
  const token = request.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  try {
    const allSiswa = loadData();

    if (allSiswa.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Tidak ada data siswa',
      });
    }

    const collection = adminDb.collection('siswa');
    let committed = 0;

    for (let i = 0; i < allSiswa.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = allSiswa.slice(i, i + 500);

      for (const siswa of chunk) {
        const docRef = collection.doc(siswa.nik);
        batch.set(docRef, {
          ...siswa,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      committed += chunk.length;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan ${committed} siswa ke Firestore`,
      count: committed,
    });
  } catch (error) {
    console.error('Error syncing siswa to Firestore:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyinkronkan data' },
      { status: 500 }
    );
  }
}
