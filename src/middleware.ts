import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Hanya proteksi untuk API routes yang sensitive
// Page routes di-handle oleh SPA client-side auth
const protectedApiPaths = ['/api/admin/', '/api/sync/', '/api/siswa/sync', '/api/siswa/import-dapodik', '/api/tugas', '/api/pegawai/detail'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('auth-token')?.value;

  // Proteksi API routes
  const isProtected = protectedApiPaths.some((p) => path.startsWith(p) || path === p);
  if (isProtected) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Basic JWT decode — verifikasi penuh dilakukan di API route via server-auth.ts
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      );
      if (!payload || !payload.user_id) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  const response = NextResponse.next();
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
