import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const roleAccess: Record<string, string[]> = {
  '/admin/super': ['superadmin'],
  '/admin/operator': ['operator', 'superadmin'],
  '/admin/organisasi': ['organisasi', 'superadmin'],
  '/api/admin': ['superadmin'],
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const userRole = payload.role || '';

      for (const [route, allowedRoles] of Object.entries(roleAccess)) {
        if (path.startsWith(route) && !allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL('/403', request.url));
        }
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Tambahkan header COOP untuk mencegah error window.closed
  const response = NextResponse.next();
  response.headers.set('Cross-Origin-Opener-Policy', 'unsafe-none');
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
