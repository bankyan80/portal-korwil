import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyCookieAuth } from '@/lib/server-auth';
import { normalizeSchool } from '@/lib/normalize';
import type { Query } from 'firebase-admin/firestore';
import siswaData from '@/data/data-siswa.json';

const PRIVILEGED_ROLES = new Set(['super_admin', 'operator_sekolah', 'ketua_organisasi']);

async function canReadFullData(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return false;

  const auth = await verifyCookieAuth(token);
  if (auth instanceof NextResponse) return false;
  return PRIVILEGED_ROLES.has(auth.role);
}

function toPublicSiswa(s: any) {
  return {
    jk: s.jk || '',
    sekolah: s.sekolah || '',
    jenjang: s.jenjang || '',
    kelas: s.kelas ?? '',
    rombel: s.rombel || '',
    layak_pip: s.layak_pip || '',
  };
}

function buildResponse(all: any[], fullData: boolean) {
  return NextResponse.json({
    count: all.length,
    siswa: fullData ? all : all.map(toPublicSiswa),
  });
}

export async function GET(req: NextRequest) {
  const jenjang = req.nextUrl.searchParams.get('jenjang');
  const layak_pip = req.nextUrl.searchParams.get('layak_pip');
  const sekolah = req.nextUrl.searchParams.get('sekolah');
  const search = req.nextUrl.searchParams.get('search');
  const limitParam = req.nextUrl.searchParams.get('limit');
  const fullData = await canReadFullData(req);

  if (!isFirebaseAdminConfigured || !adminDb) {
    // ... logic fallback static tetap sama ...
    let all = siswaData as any[];
    if (jenjang) all = all.filter((s) => s.jenjang === jenjang);
    if (layak_pip) all = all.filter((s) => s.layak_pip === layak_pip);
    if (sekolah) {
      const q = normalizeSchool(sekolah);
      all = all.filter((s) => normalizeSchool(s.sekolah || '') === q);
    }
    if (search) {
      const q = search.toLowerCase();
      all = all.filter((s) =>
        s.nama?.toLowerCase().includes(q) ||
        (fullData && s.nik?.includes(q))
      );
    }
    if (limitParam) all = all.slice(0, parseInt(limitParam));
    return buildResponse(all, fullData);
  }

  try {
    let query: any = adminDb.collection('students');
    
    // Server-side filtering untuk menghemat READ
    if (jenjang) query = query.where('jenjang', '==', jenjang);
    if (layak_pip) query = query.where('layak_pip', '==', layak_pip);
    
    // Jika ada filter sekolah, lakukan di server
    if (sekolah) {
      // Catatan: Firestore butuh index untuk multiple where. 
      // Jika error index, biarkan filter jenjang saja di server.
      query = query.where('sekolah', '==', sekolah);
    }

    // Batasi data jika hanya untuk preview
    if (limitParam) {
      query = query.limit(parseInt(limitParam));
    } else if (!search && !sekolah) {
      // Jika tidak ada pencarian spesifik, paksa limit 500 untuk keamanan kuota
      query = query.limit(500);
    }

    const snapshot = await query.get();
    let all = snapshot.docs.map((doc: any) => ({ nik: doc.id, ...doc.data() })) as any[];

    if (all.length === 0 || (all.length > 0 && !all[0].sekolah)) {
      throw new Error('Empty or incomplete Firestore data, fallback to static');
    }

    if (sekolah) {
      const q = normalizeSchool(sekolah);
      all = all.filter((s: any) => normalizeSchool(s.sekolah || '') === q);
    }
    if (search) {
      const q = search.toLowerCase();
      all = all.filter((s: any) =>
        s.nama?.toLowerCase().includes(q) ||
        (fullData && s.nik?.includes(q))
      );
    }

    return buildResponse(all, fullData);
  } catch (error) {
    console.error('Error fetching siswa from Firestore:', error);
    let all = siswaData as any[];
    if (jenjang) all = all.filter((s) => s.jenjang === jenjang);
    if (layak_pip) all = all.filter((s) => s.layak_pip === layak_pip);
    if (sekolah) {
      const q = normalizeSchool(sekolah);
      all = all.filter((s) => normalizeSchool(s.sekolah || '') === q);
    }
    if (search) {
      const q = search.toLowerCase();
      all = all.filter((s) =>
        s.nama?.toLowerCase().includes(q) ||
        (fullData && s.nik?.includes(q))
      );
    }
    return buildResponse(all, fullData);
  }
}
