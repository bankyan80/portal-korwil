import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { normalizeSchool } from '@/lib/normalize';
import type { Query } from 'firebase-admin/firestore';
import siswaData from '@/data/data-siswa.json';

export async function GET(req: NextRequest) {
  const jenjang = req.nextUrl.searchParams.get('jenjang');
  const layak_pip = req.nextUrl.searchParams.get('layak_pip');
  const sekolah = req.nextUrl.searchParams.get('sekolah');
  const search = req.nextUrl.searchParams.get('search');

  if (!isFirebaseAdminConfigured || !adminDb) {
    let all = siswaData as any[];
    if (jenjang) all = all.filter((s) => s.jenjang === jenjang);
    if (layak_pip) all = all.filter((s) => s.layak_pip === layak_pip);
    if (sekolah) {
      const q = normalizeSchool(sekolah);
      all = all.filter((s) => normalizeSchool(s.sekolah || '') === q);
    }
    if (search) {
      const q = search.toLowerCase();
      all = all.filter((s) => s.nama?.toLowerCase().includes(q) || s.nik?.includes(q));
    }
    return NextResponse.json({ count: all.length, siswa: all });
  }

  try {
    let query: Query = adminDb.collection('students');
    if (jenjang) query = query.where('jenjang', '==', jenjang);
    if (layak_pip) query = query.where('layak_pip', '==', layak_pip);

    const snapshot = await query.get();
    let all = snapshot.docs.map((doc) => ({ nik: doc.id, ...doc.data() })) as any[];

    if (all.length === 0 || (all.length > 0 && !all[0].sekolah)) {
      throw new Error('Empty or incomplete Firestore data, fallback to static');
    }

    if (sekolah) {
      const q = normalizeSchool(sekolah);
      all = all.filter((s: any) => normalizeSchool(s.sekolah || '') === q);
    }
    if (search) {
      const q = search.toLowerCase();
      all = all.filter((s: any) => s.nama?.toLowerCase().includes(q) || s.nik?.includes(q));
    }

    return NextResponse.json({ count: all.length, siswa: all });
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
      all = all.filter((s) => s.nama?.toLowerCase().includes(q) || s.nik?.includes(q));
    }
    return NextResponse.json({ count: all.length, siswa: all });
  }
}
