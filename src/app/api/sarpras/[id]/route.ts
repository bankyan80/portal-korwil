import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth } from '@/lib/server-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;

  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'sarpras')
      .eq('id', id)
      .single();
    if (error || !data) return NextResponse.json({ exists: false, data: null });
    return NextResponse.json({ exists: true, data: { id: data.id, ...(data.data as object) } });
  } catch (e) {
    console.error('[sarpras] GET error:', e);
    return NextResponse.json({ error: 'Gagal memuat data sarpras' }, { status: 500 });
  }
}
