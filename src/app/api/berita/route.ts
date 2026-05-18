import { NextRequest, NextResponse } from 'next/server';
import { getAllBerita, createBerita } from '@/services/berita.service';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

export async function GET() {
  const data = await getAllBerita();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  // Verify auth - only authenticated users can create news
  const token = request.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
  if (forbidden) return forbidden;

  const body = await request.json();
  const id = await createBerita(body);
  return NextResponse.json({ id }, { status: 201 });
}
