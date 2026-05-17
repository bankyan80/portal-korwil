import { NextResponse } from 'next/server';
import { getAllPegawai } from '@/services/pegawai.service';

export async function GET() {
  try {
    const data = await getAllPegawai();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}
