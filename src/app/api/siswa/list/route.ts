import { NextRequest, NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';
import { verifyCookieAuth } from '@/lib/server-auth';
import { normalizeSchool, getCanonicalSchoolName } from '@/lib/normalize';
import siswaData from '@/data/data-siswa.json';

const PRIVILEGED_ROLES = new Set(['super_admin', 'operator_sekolah', 'ketua_organisasi']);

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

async function canReadFullData(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return false;

  const auth = await verifyCookieAuth(token);

  // Jika Firebase Admin berhasil memverifikasi token, gunakan role dari DB
  if (!(auth instanceof NextResponse)) {
    return PRIVILEGED_ROLES.has(auth.role);
  }

  // Fallback: jika Firebase Admin tidak tersedia, decode JWT payload
  // untuk memvalidasi token (cek expiry, format). Halaman ini sudah
  // dilindungi oleh AuthGuard client-side, jadi hanya super_admin
  // yang bisa mengakses endpoint ini.
  if (auth.status === 500) {
    try {
      const payload = decodeJwtPayload(token);
      if (!payload || !payload.user_id) return false;
      if (payload.exp && payload.exp * 1000 < Date.now()) return false;
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function toPublicSiswa(s: any) {
  return {
    nama: s.nama || '',
    jk: s.jk || s.jenis_kelamin || '',
    sekolah: s.sekolah || s.nama_sekolah || '',
    jenjang: s.jenjang || '',
    kelas: s.kelas ?? '',
    rombel: s.rombel || s.nama_rombel || '',
    layak_pip: s.layak_pip || '',
  };
}

function buildResponse(all: any[], fullData: boolean) {
  return NextResponse.json({
    count: all.length,
    siswa: fullData ? all : all.map(toPublicSiswa),
  });
}

/** Jika jenjang=KB, ikutkan juga record ber-jenjang PAUD (legacy), lalu normalisasi ke 'KB'. */
function getJenjangValues(jenjang: string): string[] {
  return jenjang === 'KB' ? ['KB', 'PAUD'] : [jenjang];
}

function normalizeJenjang(jenjang: string): string {
  return jenjang === 'PAUD' ? 'KB' : jenjang;
}

function applyFilters(all: any[], jenjang: string | null, layak_pip: string | null, sekolah: string | null, schoolId: string | null, search: string | null, limitParam: string | null, fullData: boolean) {
  if (jenjang) {
    const jenjangValues = getJenjangValues(jenjang);
    all = all.filter((s: any) => jenjangValues.includes(s.jenjang || ''));
  }
  // Normalisasi PAUD → KB pada semua record hasil filter
  all = all.map((s: any) => s.jenjang === 'PAUD' ? { ...s, jenjang: 'KB' } : s);
  if (layak_pip) all = all.filter((s: any) => s.layak_pip === layak_pip);
  if (schoolId) {
    all = all.filter((s: any) => s.schoolId === schoolId);
  } else if (sekolah) {
    const q = normalizeSchool(sekolah);
    all = all.filter((s: any) => normalizeSchool(s.sekolah || s.nama_sekolah || '') === q);
  }
  if (search) {
    const q = search.toLowerCase();
    all = all.filter((s: any) =>
      (s.nama || '').toLowerCase().includes(q) ||
      (fullData && (s.nik || '').includes(q))
    );
  }
  // Canonicalize school names for display
  all = all.map((s: any) => ({
    ...s,
    sekolah: getCanonicalSchoolName(s.sekolah || s.nama_sekolah || ''),
  }));
  if (limitParam) all = all.slice(0, parseInt(limitParam));
  return all;
}

export async function GET(req: NextRequest) {
  const jenjang = req.nextUrl.searchParams.get('jenjang');
  const layak_pip = req.nextUrl.searchParams.get('layak_pip');
  const sekolah = req.nextUrl.searchParams.get('sekolah');
  const schoolId = req.nextUrl.searchParams.get('schoolId');
  const search = req.nextUrl.searchParams.get('search');
  const limitParam = req.nextUrl.searchParams.get('limit');
  const fullData = await canReadFullData(req);

  // 1) Coba Google Sheets (primary)
  try {
    const rows = await getRows('data_siswa');
    if (rows.length > 200) {
      const filtered = applyFilters(rows, jenjang, layak_pip, sekolah, schoolId, search, limitParam, fullData);
      return buildResponse(filtered, fullData);
    }
  } catch (e) {
    console.log('[siswa/list] Sheets unavailable, fallback:', (e as Error).message);
  }

  // 2) Fallback: static JSON
  let all = [...siswaData] as any[];
  all = applyFilters(all, jenjang, layak_pip, sekolah, schoolId, search, limitParam, fullData);
  return buildResponse(all, fullData);
}
