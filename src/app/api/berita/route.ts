import { NextResponse } from 'next/server';
import { getAllBerita, createBerita } from '@/services/berita.service';

export async function GET() {
  const data = await getAllBerita();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = await createBerita(body);
  return NextResponse.json({ id }, { status: 201 });
}
