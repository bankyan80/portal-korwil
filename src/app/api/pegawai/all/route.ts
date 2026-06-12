import { NextRequest, NextResponse } from 'next/server';
import { verifyCookieAuth } from '@/lib/server-auth';
import { getAllPegawai } from '@/services/pegawai.service';

const PRIVILEGED_ROLES = new Set(['super_admin', 'operator_sekolah']);
const BUP_AGE = 60;

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

  if (!(auth instanceof NextResponse)) {
    return PRIVILEGED_ROLES.has(auth.role);
  }

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

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function getBupDate(iso: string): string {
  const birth = parseDate(iso);
  if (!birth) return '';
  const month = birth.getMonth() + 1;
  const year = birth.getFullYear() + BUP_AGE;
  return new Date(year, month, 1).toISOString().slice(0, 10);
}

function isPensionEligible(status: string): boolean {
  return status === 'PNS' || status === 'PPPK';
}

function toPublicPegawai(p: any) {
  return {
    nama: p.nama || '',
    jk: p.jk || '',
    status_kepegawaian: p.status_kepegawaian || '',
    jenis_ptk: p.jenis_ptk || '',
    tugas_tambahan: p.tugas_tambahan || '',
    sertifikasi: p.sertifikasi || '',
    sekolah: p.sekolah || '',
    role: p.role || '',
    npsn: p.npsn || '',
    jenjang: p.jenjang || '',
    tmt: p.tmt || '',
    bup_tanggal: isPensionEligible(p.status_kepegawaian) ? getBupDate(p.tanggal_lahir) : '',
  };
}

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
    const search = req.nextUrl.searchParams.get('search') || '';
    const allParam = req.nextUrl.searchParams.get('all');
    const fullData = await canReadFullData(req);

    let all = await getAllPegawai();

    if (search) {
      const q = search.toLowerCase();
      all = all.filter((d: any) =>
        (d.nama || '').toLowerCase().includes(q) ||
        (d.sekolah || '').toLowerCase().includes(q) ||
        (fullData && (
          (d.nik || '').includes(q) ||
          (d.nip || '').includes(q) ||
          (d.nuptk || '').toLowerCase().includes(q)
        ))
      );
    }

    const total = all.length;
    const serialize = (items: any[]) => fullData ? items : items.map(toPublicPegawai);

    if (allParam === 'true') {
      return NextResponse.json({ items: serialize(all), page: 1, totalPages: 1, total });
    }

    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    return NextResponse.json({ items: serialize(items), page, totalPages, total });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}
