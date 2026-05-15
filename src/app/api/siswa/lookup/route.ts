import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json(
      { found: false, message: 'Firebase Admin tidak dikonfigurasi' },
      { status: 500 }
    );
  }

  const nik = req.nextUrl.searchParams.get('nik')?.replace(/\D/g, '');
  if (!nik) {
    return NextResponse.json({ found: false, message: 'NIK tidak diberikan' });
  }

  try {
    let doc = await adminDb.collection('siswa').doc(nik).get();
    let s = doc.data();

    if (!doc.exists || !s) {
      const studentsSnap = await adminDb.collection('students').where('nik', '==', nik).get();
      if (!studentsSnap.empty) {
        s = studentsSnap.docs[0].data();
        s = { ...s, nik: s.nik || nik };
      }
    }

    if (!s) {
      return NextResponse.json({ found: false, message: 'NIK tidak ditemukan dalam database' });
    }

    return NextResponse.json({
      found: true,
      siswa: {
        nik: s.nik || nik,
        nama: s.nama,
        jk: s.jk,
        nisn: s.nisn,
        tanggal_lahir: s.tanggal_lahir,
        sekolah: s.sekolah,
        jenjang: s.jenjang,
        desa: s.desa,
      },
    });
  } catch (error) {
    console.error('Error looking up siswa in Firestore:', error);
    return NextResponse.json(
      { found: false, message: 'Gagal mencari data' },
      { status: 500 }
    );
  }
}
