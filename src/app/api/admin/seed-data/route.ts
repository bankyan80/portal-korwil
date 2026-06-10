import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import { allSekolah } from '@/data/sekolah';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const MIGRATION_API_KEY = process.env.MIGRATION_API_KEY;
    if (apiKey && MIGRATION_API_KEY && apiKey === MIGRATION_API_KEY) {
    } else {
      const authToken = request.cookies.get('auth-token')?.value;
      if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const auth = await verifyCookieAuth(authToken);
      const forbidden = requireRole(auth, ['super_admin']);
      if (forbidden) return forbidden;
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

    const results: Record<string, { success: number; errors: number }> = {};

    // 1. Seed schools from static data
    results.schools = { success: 0, errors: 0 };
    for (const school of allSekolah) {
      const id = school.npsn;
      const { error } = await supabaseAdmin
        .from('app_data')
        .upsert({
          id,
          collection: 'schools',
          data: {
            namaSekolah: school.nama,
            npsn: school.npsn,
            nss: school.nss,
            jenjang: school.jenjang,
            statusSekolah: school.status === 'NEGERI' ? 'Negeri' : 'Swasta',
            akreditasi: school.akreditasi,
            alamat: school.address,
            desa: school.desa,
            kecamatan: 'Lemahabang',
            dayaTampung: school.dayaTampung,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      if (error) results.schools.errors++;
      else results.schools.success++;
    }

    // 2. Seed employee_mappings placeholders for each school
    results.employee_mappings = { success: 0, errors: 0 };
    for (const school of allSekolah) {
      const id = `map_${school.npsn}`;
      const { error } = await supabaseAdmin
        .from('app_data')
        .upsert({
          id,
          collection: 'employee_mappings',
          data: {
            schoolId: school.npsn,
            namaSekolah: school.nama,
            jenjang: school.jenjang,
            npsn: school.npsn,
            totalPegawaiTersedia: 0,
            totalPegawaiAktif: 0,
            totalKebutuhanIdeal: 0,
            totalGuruIdeal: 0,
            totalTendikIdeal: 2,
            rincianJabatan: {},
            updatedAt: Date.now(),
          },
        });
      if (error) results.employee_mappings.errors++;
      else results.employee_mappings.success++;
    }

    // 3. Seed system_settings defaults if not exist
    results.system_settings = { success: 0, errors: 0 };
    const { data: existingSettings } = await supabaseAdmin
      .from('app_data')
      .select('id')
      .eq('collection', 'system_settings')
      .limit(1);
    if (!existingSettings?.length) {
      const { error } = await supabaseAdmin
        .from('app_data')
        .insert({
          id: 'default_settings',
          collection: 'system_settings',
          data: {
            appName: 'Portal Dinas',
            periodeAktif: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            batasLaporBulanan: 10,
            maintenanceMode: false,
            updatedAt: Date.now(),
          },
        });
      if (!error) results.system_settings.success = 1;
      else results.system_settings.errors = 1;
    }

    return NextResponse.json({
      success: true,
      message: 'Seed data selesai',
      results,
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
