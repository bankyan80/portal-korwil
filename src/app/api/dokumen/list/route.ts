import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ documents: [] });
  }

  const nip = req.nextUrl.searchParams.get('nip')?.replace(/\D/g, '') || '';
  if (!nip) {
    return NextResponse.json({ error: 'NIP wajib diisi' }, { status: 400 });
  }

  const token = req.cookies.get('auth-token')?.value;
  const authUser = await verifyCookieAuth(token || '');
  const forbidden = requireRole(authUser, ['super_admin', 'operator_sekolah']);
  if (forbidden) return forbidden;

  try {
    const byNip = await adminDb.collection('dokumen').where('nip', '==', nip).get();
    const byNik = await adminDb.collection('dokumen').where('nik', '==', nip).get();
    const docs = new Map<string, unknown>();

    byNip.forEach((doc) => docs.set(doc.id, { id: doc.id, ...doc.data() }));
    byNik.forEach((doc) => docs.set(doc.id, { id: doc.id, ...doc.data() }));

    return NextResponse.json({ documents: Array.from(docs.values()) });
  } catch (error) {
    console.error('Error fetching dokumen:', error);
    return NextResponse.json({ error: 'Gagal mengambil dokumen' }, { status: 500 });
  }
}
