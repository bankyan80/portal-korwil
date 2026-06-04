import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import { allSekolah } from '@/data/sekolah';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    // Allow x-api-key bypass for automated seeding
    const apiKey = request.headers.get('x-api-key');
    const MIGRATION_API_KEY = process.env.MIGRATION_API_KEY;
    if (apiKey && MIGRATION_API_KEY && apiKey === MIGRATION_API_KEY) {
      // proceed without role check
    } else {
      const authToken = request.cookies.get('auth-token')?.value;
      if (!authToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const auth = await verifyCookieAuth(authToken);
      const forbidden = requireRole(auth, ['super_admin']);
      if (forbidden) return forbidden;
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

    // Hapus data passwords sebelumnya
    await supabaseAdmin.from('app_data').delete().eq('collection', 'school_passwords');

    const passwordHash = hashPassword('123456');
    const now = Date.now();
    let count = 0;

    for (const school of allSekolah) {
      if (!school.npsn) continue;

      const { error: upsertError } = await supabaseAdmin
        .from('app_data')
        .upsert({
          id: school.npsn,
          collection: 'school_passwords',
          data: {
            npsn: school.npsn,
            schoolName: school.nama,
            passwordHash,
            createdAt: now,
            updatedAt: now,
          },
        });

      if (upsertError) {
        console.error(`Error seeding ${school.npsn} (${school.nama}):`, upsertError.message);
      } else {
        count++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil seed ${count} sekolah dengan password default 123456`,
      total: allSekolah.length,
    });
  } catch (error) {
    console.error('Error seeding passwords:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
