import { NextRequest, NextResponse } from 'next/server';
import { getAllPegawai } from '@/services/pegawai.service';

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
    const search = req.nextUrl.searchParams.get('search') || '';

    let all = await getAllPegawai();

    if (search) {
      const q = search.toLowerCase();
      all = all.filter((d: any) =>
        (d.nama || '').toLowerCase().includes(q) ||
        (d.nip || '').includes(q) ||
        (d.nuptk || '').includes(q)
      );
    }

    const total = all.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    return NextResponse.json({ items, page, totalPages, total });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}
