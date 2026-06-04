import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;
  const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
  if (forbidden) return forbidden;

  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json({ documents: [] });
  }

  const nip = req.nextUrl.searchParams.get('nip')?.replace(/\D/g, '') || '';
  if (!nip) {
    return NextResponse.json({ documents: [] });
  }

  try {
    const { data } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'dokumen');

    const docs = new Map<string, unknown>();
    for (const r of data || []) {
      const d = r.data as Record<string, unknown> || {};
      if (d.nip === nip || d.nik === nip) {
        docs.set(r.id, { id: r.id, ...d });
      }
    }

    return NextResponse.json({ documents: Array.from(docs.values()) });
  } catch (error) {
    console.error('Error fetching dokumen:', error);
    return NextResponse.json({ error: 'Gagal mengambil dokumen' }, { status: 500 });
  }
}
