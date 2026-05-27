import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
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
