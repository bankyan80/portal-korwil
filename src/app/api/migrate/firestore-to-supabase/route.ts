import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

const COLLECTIONS = [
  'users', 'schools', 'organizations', 'reports', 'laporan_bulanan',
  'kip_sd', 'yatim_piatu', 'dokumen', 'bos_arkas', 'tabel_sekolah',
  'settings', 'dashboard_summary', 'menus', 'announcements', 'gallery',
  'institution_links', 'news', 'program_kerja', 'spmb_sd', 'calendar_events',
  'agenda', 'pegawai_tambahan', 'task_groups', 'task_progress', 'berita',
  'sarpras', 'employees', 'students',
];

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
  }
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase Admin not configured' }, { status: 500 });
  }

  // Allow API key auth for headless/script calls
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && apiKey === process.env.MIGRATION_API_KEY) {
    // API key authenticated
  } else {
    const token = req.cookies.get('auth-token')?.value;
    const auth = await verifyCookieAuth(token || '');
    const forbidden = requireRole(auth, ['super_admin']);
    if (forbidden) return forbidden;
  }

  const { searchParams } = new URL(req.url);
  const specificCollection = searchParams.get('collection');
  const collections = specificCollection ? [specificCollection] : COLLECTIONS;

  const results: Record<string, { success: number; failed: number; error?: string }> = {};

  for (const name of collections) {
    try {
      const snap = await adminDb.collection(name).get();
      if (snap.empty) {
        results[name] = { success: 0, failed: 0 };
        continue;
      }

      const docs = snap.docs.map(d => ({
        id: d.id,
        collection: name,
        data: d.data(),
        updated_at: new Date().toISOString(),
      }));

      const CHUNK = 100;
      let success = 0;
      let failed = 0;

      for (let i = 0; i < docs.length; i += CHUNK) {
        const chunk = docs.slice(i, i + CHUNK);
        const { error } = await supabaseAdmin
          .from('app_data')
          .upsert(chunk, { onConflict: 'id' });
        if (error) {
          console.error(`[migrate/${name}] chunk error:`, error.message, error.details);
          failed += chunk.length;
        } else {
          success += chunk.length;
        }
      }

      results[name] = { success, failed };
    } catch (e: any) {
      results[name] = { success: 0, failed: -1, error: e.message };
    }
  }

  const totalSuccess = Object.values(results).reduce((s, r) => s + r.success, 0);
  const totalFailed = Object.values(results).reduce((s, r) => s + r.failed, 0);

  return NextResponse.json({
    success: true,
    results,
    summary: { totalSuccess, totalFailed, collections: collections.length },
  });
}

export async function GET() {
  return NextResponse.json({
    collections: COLLECTIONS,
    note: 'POST /api/migrate/firestore-to-supabase to trigger migration. Use ?collection=xxx for single collection.',
  });
}
