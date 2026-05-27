import { NextRequest, NextResponse } from 'next/server';
import { getAllPegawai } from '@/services/pegawai.service';

export async function GET(req: NextRequest) {
  const nik = req.nextUrl.searchParams.get('nik')?.replace(/\D/g, '');
  const nip = req.nextUrl.searchParams.get('nip')?.replace(/\D/g, '');
  const search = req.nextUrl.searchParams.get('search')?.toLowerCase();
  const sekolah = req.nextUrl.searchParams.get('sekolah');

  const all = await getAllPegawai();

  if (nik) {
    const match = all.find((s: any) => s.nik === nik);
    if (!match) {
      return NextResponse.json({ found: false, message: 'NIK tidak ditemukan' });
    }
    return NextResponse.json({ found: true, pegawai: match });
  }

  if (nip) {
    const match = all.find((s: any) => s.nip === nip);
    if (!match) {
      return NextResponse.json({ found: false, message: 'NIP tidak ditemukan' });
    }
    return NextResponse.json({ found: true, pegawai: match });
  }

  if (search) {
    const results = all.filter(
      (s: any) =>
        s.nama?.toLowerCase().includes(search) ||
        s.nik?.includes(search) ||
        s.nip?.includes(search) ||
        s.nuptk?.toLowerCase().includes(search)
    );
    return NextResponse.json({ found: results.length > 0, results: results.slice(0, 50) });
  }

  if (sekolah) {
    const results = all.filter((s: any) => s.sekolah?.toLowerCase().includes(sekolah.toLowerCase()));
    return NextResponse.json({ found: results.length > 0, results });
  }

  return NextResponse.json({ total: all.length });
}
