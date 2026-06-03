import { NextRequest, NextResponse } from 'next/server';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';

function loadSiswa(): any[] {
  const p = path.join(process.cwd(), 'src', 'data', 'data-siswa.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
  if (forbidden) return forbidden;

  const nik = req.nextUrl.searchParams.get('nik')?.replace(/\D/g, '');
  if (!nik) {
    return NextResponse.json({ found: false, message: 'NIK tidak diberikan' });
  }

  try {
    const all = loadSiswa();
    const s = all.find((item: any) => item.nik === nik);

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
        kelas: s.kelas != null ? String(s.kelas) : '',
      },
    });
  } catch (error) {
    console.error('Error looking up siswa:', error);
    return NextResponse.json(
      { found: false, message: 'Gagal mencari data' },
      { status: 500 }
    );
  }
}
