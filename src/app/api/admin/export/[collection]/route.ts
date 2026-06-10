import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params;

    const authToken = req.cookies.get('auth-token')?.value;
    if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const auth = await verifyCookieAuth(authToken);
    const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
    if (forbidden) return forbidden;

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId');

    let query = supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', collection);

    if (schoolId) {
      query = query.filter('data->>schoolId', 'eq', schoolId);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data?.length) {
      return NextResponse.json({ error: 'No data' }, { status: 404 });
    }

    const rows = data.map((r) => {
      const flat = { id: r.id, ...(r.data as Record<string, unknown>) };
      delete flat.createdAt; delete flat.updatedAt; delete flat.updated_at;
      return flat;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, collection);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${collection}-${Date.now()}.xlsx"`,
      },
    });
  } catch (e) {
    console.error('[export] error:', e);
    return NextResponse.json({ error: 'Gagal export' }, { status: 500 });
  }
}
