import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const DEFAULT_PASSWORD = '123456';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-api-key');
    const apiKey = process.env.MIGRATION_API_KEY;

    if (apiKey && authHeader !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

    const { data: schools, error } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'schools');

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil data sekolah' }, { status: 500 });
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data sekolah' }, { status: 404 });
    }

    const passwordHash = hashPassword(DEFAULT_PASSWORD);
    const now = Date.now();
    let count = 0;

    for (const school of schools) {
      const schoolData = school.data as Record<string, any>;
      const npsn = school.id || schoolData.npsn;
      if (!npsn) continue;

      const existing = schoolData.schoolName || schoolData.nama || '';

      const { error: upsertError } = await supabaseAdmin
        .from('app_data')
        .upsert({
          id: String(npsn),
          collection: 'school_passwords',
          data: {
            npsn: String(npsn),
            schoolName: existing,
            passwordHash,
            createdAt: now,
            updatedAt: now,
          },
        });

      if (!upsertError) count++;
    }

    return NextResponse.json({
      success: true,
      count,
      total: schools.length,
      message: `Berhasil seeding password untuk ${count} dari ${schools.length} sekolah`,
    });
  } catch (e) {
    console.error('Seed passwords error:', e);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
