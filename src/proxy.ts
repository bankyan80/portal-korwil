import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROUTE_ADMIN_PREFIXES = ['/admin/super', '/admin/operator', '/admin/organisasi'];

const PUBLIC_ROUTES = [
  '/login', '/', '/profil', '/data-sekolah', '/organisasi',
  '/spmb', '/kalender', '/berita', '/galeri', '/administrasi',
  '/laporan', '/data-pd', '/data-gtk', '/data-tk', '/data-sd',
  '/data-paud', '/data-rombel', '/kip-sd', '/spmb-sd',
  '/yatim-piatu', '/agenda-kegiatan', '/website-sekolah',
  '/e-kinerja', '/dapodik', '/bos-arkas', '/rekap-laporan',
  '/ruang-guru', '/dokumen-bersama', '/bup', '/donasi',
  '/semua-galeri', '/semua-informasi',
];

const API_ROUTES = ['/api'];
const STATIC_ROUTES = ['/_next', '/favicon', '/images', '/icons', '/portalnew.png'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStatic = STATIC_ROUTES.some(p => pathname.startsWith(p));
  if (isStatic) return NextResponse.next();

  const isApi = API_ROUTES.some(p => pathname.startsWith(p));
  if (isApi) return NextResponse.next();

  const isPublic = PUBLIC_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return NextResponse.next();

  const isRouteAdmin = ROUTE_ADMIN_PREFIXES.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  );
  if (isRouteAdmin) return NextResponse.next();

  if (pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
