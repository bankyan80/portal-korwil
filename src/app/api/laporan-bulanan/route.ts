import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth } from '@/lib/server-auth';

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export async function GET(req: NextRequest) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('schoolId');
  const tahun = searchParams.get('tahun');
  const bulan = searchParams.get('bulan');
  const mode = searchParams.get('mode') || 'history';

  try {
    let supabaseQuery = supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'laporan_bulanan');

    if (mode === 'single' && schoolId && tahun && bulan) {
      const blnIndex = String(bulanList.indexOf(bulan) + 1).padStart(2, '0');
      const docId = `${schoolId}_${tahun}_${blnIndex}`;
      const { data, error } = await supabaseQuery.eq('id', docId).single();
      if (error || !data) return NextResponse.json({ exists: false, data: null });
      return NextResponse.json({ exists: true, data: { id: data.id, ...(data.data as object) } });
    }

    if (mode === 'history' && schoolId) {
      const { data, error } = await supabaseQuery;
      if (error) throw error;
      const items: any[] = (data || [])
        .filter((r) => (r.data as any)?.sekolahId === schoolId)
        .map((r) => ({ id: r.id, ...(r.data as object) }));
      items.sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || (bulanList.indexOf(a.bulan || '') - bulanList.indexOf(b.bulan || '')));
      return NextResponse.json({ items });
    }

    const { data, error } = await supabaseQuery;
    if (error) throw error;
    const items: any[] = (data || []).map((r) => ({ id: r.id, ...(r.data as object) }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error('[laporan-bulanan] GET error:', e);
    return NextResponse.json({ error: 'Gagal memuat data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseAdminConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;

  try {
    const body = await req.json();
    const { schoolId, tahun, bulan, payload } = body;

    if (!schoolId || !tahun || !bulan || !payload) {
      return NextResponse.json({ error: 'schoolId, tahun, bulan, payload required' }, { status: 400 });
    }

    const blnIndex = String(bulanList.indexOf(bulan) + 1).padStart(2, '0');
    const docId = `${schoolId}_${tahun}_${blnIndex}`;

    const savePayload = {
      ...payload,
      sekolahId: schoolId,
      dikirimPada: Date.now(),
      updatedAt: Date.now(),
    };

    const { error } = await supabaseAdmin
      .from('app_data')
      .upsert({
        id: docId,
        collection: 'laporan_bulanan',
        data: savePayload,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;

    return NextResponse.json({ success: true, id: docId });
  } catch (e) {
    console.error('[laporan-bulanan] POST error:', e);
    return NextResponse.json({ error: 'Gagal menyimpan laporan' }, { status: 500 });
  }
}
