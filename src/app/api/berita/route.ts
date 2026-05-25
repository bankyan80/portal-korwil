import { NextRequest, NextResponse } from 'next/server';
import { getAllBerita, createBerita } from '@/services/berita.service';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

export async function GET() {
  try {
    const data = await getAllBerita();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Berita GET error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat berita' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth - only authenticated users can create news
    const token = request.cookies.get('auth-token')?.value;
    const auth = await verifyCookieAuth(token || '');
    const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
    if (forbidden) return forbidden;

    const body = await request.json();
    const id = await createBerita(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('Berita POST error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan berita' }, { status: 500 });
  }
}
