import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    let authorized = false;
    const apiKey = request.headers.get('x-api-key');
    const MIGRATION_API_KEY = process.env.MIGRATION_API_KEY;
    if (apiKey && MIGRATION_API_KEY && apiKey === MIGRATION_API_KEY) {
      authorized = true;
    } else {
      const authToken = request.cookies.get('auth-token')?.value;
      if (authToken) {
        const auth = await verifyCookieAuth(authToken);
        const forbidden = requireRole(auth, ['super_admin']);
        if (!forbidden) authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

    const log: string[] = [];
    let updated = 0;

    const { data: schools } = await supabaseAdmin
      .from('app_data')
      .select('id, data')
      .eq('collection', 'schools');

    if (!schools?.length) {
      return NextResponse.json({ success: true, message: 'Tidak ada sekolah', updated: 0 });
    }

    for (const school of schools) {
      const schoolData = school.data as Record<string, any> || {};
      const schoolId = school.id;

      const { count: siswaCount } = await supabaseAdmin
        .from('app_data')
        .select('*', { count: 'exact', head: true })
        .eq('collection', 'students')
        .eq('data->>schoolId', schoolId);

      const { count: guruCount } = await supabaseAdmin
        .from('app_data')
        .select('*', { count: 'exact', head: true })
        .eq('collection', 'employees')
        .eq('data->>schoolId', schoolId)
        .eq('data->>jenis_ptk', 'Guru');

      const { count: tendikCount } = await supabaseAdmin
        .from('app_data')
        .select('*', { count: 'exact', head: true })
        .eq('collection', 'employees')
        .eq('data->>schoolId', schoolId)
        .neq('data->>jenis_ptk', 'Guru');

      schoolData.jumlahSiswa = siswaCount || 0;
      schoolData.jumlahGuru = guruCount || 0;
      schoolData.jumlahTendik = tendikCount || 0;
      schoolData.updatedAt = Date.now();

      const { error } = await supabaseAdmin
        .from('app_data')
        .update({ data: schoolData })
        .eq('id', schoolId)
        .eq('collection', 'schools');

      if (error) {
        log.push(`Gagal update ${schoolId} (${schoolData.namaSekolah || ''}): ${error.message}`);
      } else {
        updated++;
        log.push(`OK ${schoolId} — siswa:${siswaCount || 0} guru:${guruCount || 0} tendik:${tendikCount || 0}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${updated} sekolah diperbarui`,
      total: schools.length,
      updated,
      log,
    });
  } catch (error) {
    console.error('Error syncing school stats:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
