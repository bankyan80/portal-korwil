import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection } = await params;

    const apiKey = req.headers.get('x-api-key');
    const MIGRATION_API_KEY = process.env.MIGRATION_API_KEY;
    if (!apiKey || !MIGRATION_API_KEY || apiKey !== MIGRATION_API_KEY) {
      const authToken = req.cookies.get('auth-token')?.value;
      if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const auth = await verifyCookieAuth(authToken);
      const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
      if (forbidden) return forbidden;
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File diperlukan' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

    if (!rows.length) return NextResponse.json({ error: 'File kosong' }, { status: 400 });

    let success = 0;
    let errors = 0;

    for (const row of rows) {
      const id = (row.id as string) || crypto.randomUUID();
      delete row.id;

      const { error } = await supabaseAdmin
        .from('app_data')
        .upsert({
          id,
          collection,
          data: { ...row, updatedAt: Date.now() },
        }, { onConflict: 'id' });

      if (error) errors++;
      else success++;
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${success} berhasil, ${errors} gagal`,
      total: rows.length,
    });
  } catch (e) {
    console.error('[import] error:', e);
    return NextResponse.json({ error: 'Gagal import' }, { status: 500 });
  }
}
