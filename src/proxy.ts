import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Hanya proteksi untuk API routes yang sensitive.
// Page routes di-handle oleh SPA client-side auth.
const protectedApiPaths = ['/api/admin/', '/api/sync/', '/api/siswa/import-dapodik', '/api/tugas', '/api/pegawai/detail', '/api/drive/upload', '/api/upload-pegawai'];

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length);
}

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1];
  if (!payload) return null;
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
  return JSON.parse(atob(padded));
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('auth-token')?.value || getBearerToken(request);

  // Bypass middleware auth for self-authenticating routes (route validates x-api-key internally)
  const selfAuthPaths = ['/api/admin/seed-passwords', '/api/migrate/firestore-to-supabase'];
  const isSelfAuth = selfAuthPaths.includes(path);
  if (isSelfAuth && request.headers.get('x-api-key')) {
    return NextResponse.next();
  }

  const isProtected = protectedApiPaths.some((p) => path.startsWith(p) || path === p);
  if (isProtected) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Basic JWT decode; verifikasi penuh dilakukan di API route via server-auth.ts.
    try {
      const payload = decodeJwtPayload(token);
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
