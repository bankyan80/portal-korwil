import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth } from '@/lib/server-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { collection } = await params;
const PUBLIC_COLLECTIONS = ['announcements', 'menus', 'institution_links', 'organizations', 'contacts', 'faq'];
if (!PUBLIC_COLLECTIONS.includes(collection)) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;
}
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const orderByField = searchParams.get('orderBy');
  const orderDir = searchParams.get('orderDir') || 'asc';
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const field = searchParams.get('field');
  const value = searchParams.get('value');

  try {
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('app_data')
        .select('*')
        .eq('collection', collection)
        .eq('id', id)
        .single();
      if (error || !data) return NextResponse.json({ exists: false, data: null });
      return NextResponse.json({ exists: true, data: { id: data.id, ...(data.data as object) } });
    }

    let query = supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', collection);

    if (field && value) {
      query = query.filter(`data->>${field}`, 'eq', value);
    }

    if (orderByField) {
      query = query.order(`data->>${orderByField}`, { ascending: orderDir === 'asc' });
    }

    query = query.limit(limit);

    const { data, error } = await Promise.race([
      Promise.resolve(query),
      new Promise<{ data: null; error: { message: string } }>((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 7000)
      ),
    ]);
    if (error) throw error;

    const items = (data || []).map((r) => ({ id: r.id, ...(r.data as object) }));
    return NextResponse.json({ items, count: items.length });
  } catch (e) {
    console.error(`[firestore/${collection}] GET error:`, e);
    return NextResponse.json({ items: [], count: 0 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { collection } = await params;
const PUBLIC_COLLECTIONS = ['announcements', 'menus', 'institution_links', 'organizations', 'contacts', 'faq'];
if (!PUBLIC_COLLECTIONS.includes(collection)) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;
}

  try {
    const body = await req.json();
    const { id, data, merge } = body;

    if (!data) {
      return NextResponse.json({ error: 'data required' }, { status: 400 });
    }

    if (id) {
      if (merge !== false) {
        const { data: existing } = await supabaseAdmin
          .from('app_data')
          .select('data')
          .eq('collection', collection)
          .eq('id', id)
          .single();
        const merged = { ...(existing?.data as object || {}), ...data, updatedAt: Date.now() };
        const { error } = await supabaseAdmin
          .from('app_data')
          .upsert({ id, collection, data: merged, updated_at: new Date().toISOString() });
        if (error) throw error;
      } else {
        const record = { ...data, updatedAt: Date.now() };
        const { error } = await supabaseAdmin
          .from('app_data')
          .upsert({ id, collection, data: record, updated_at: new Date().toISOString() });
        if (error) throw error;
      }
      return NextResponse.json({ success: true, id });
    }

    const newId = crypto.randomUUID();
    const record = { ...data, createdAt: Date.now(), updatedAt: Date.now() };
    const { error } = await supabaseAdmin
      .from('app_data')
      .insert({ id: newId, collection, data: record });
    if (error) throw error;
    return NextResponse.json({ success: true, id: newId });
  } catch (e) {
    console.error(`[firestore/${collection}] POST error:`, e);
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { collection } = await params;
const PUBLIC_COLLECTIONS = ['announcements', 'menus', 'institution_links', 'organizations', 'contacts', 'faq'];
if (!PUBLIC_COLLECTIONS.includes(collection)) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;
}
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  try {
    const { error } = await supabaseAdmin
      .from('app_data')
      .delete()
      .eq('collection', collection)
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(`[firestore/${collection}] DELETE error:`, e);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}

