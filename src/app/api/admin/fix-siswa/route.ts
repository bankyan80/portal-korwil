import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import { allSekolah, type BaseSekolah } from '@/data/sekolah';

function normalizeSchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/kecamatan\s+lemahabang/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSchoolIndex(schools: BaseSekolah[]): Map<string, string> {
  const idx = new Map<string, string>();
  for (const s of schools) {
    const npsn = s.npsn;
    const original = s.nama.toLowerCase();
    idx.set(original, npsn);
    const normalized = original.replace(/^(sd|tk|kb|paud)\s+/, '').trim();
    if (normalized !== original) idx.set(normalized, npsn);
  }
  return idx;
}

function matchStudentSchool(
  studentNamaSekolah: string | undefined | null,
  allSchools: BaseSekolah[],
  index: Map<string, string>
): string | null {
  if (!studentNamaSekolah) return null;
  const name = normalizeSchoolName(studentNamaSekolah);
  if (!name) return null;

  const direct = index.get(name);
  if (direct) return direct;

  for (const [key, npsn] of index) {
    if (key.includes(name) || name.includes(key)) {
      return npsn;
    }
  }

  return null;
}

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

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || '';
    const BATCH = 500;

    const schoolIndex = buildSchoolIndex(allSekolah);

    const log: string[] = [];
    let processed = 0;
    let updated = 0;
    let errors = 0;
    let lastId = '';

    let query = supabaseAdmin
      .from('app_data')
      .select('id, data')
      .eq('collection', 'students')
      .order('id')
      .limit(BATCH);

    if (cursor) query = query.gt('id', cursor);

    const { data: students, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({ success: true, done: true, log: ['Tidak ada siswa yang perlu diproses'] });
    }

    lastId = students[students.length - 1].id;

    for (const stu of students) {
      processed++;
      const d = stu.data as Record<string, any>;
      const namaSekolah = d.namaSekolah || d.sekolah || '';
      let schoolId = '';

      if (namaSekolah) {
        const match = matchStudentSchool(namaSekolah, allSekolah, schoolIndex);
        if (match) schoolId = match;
      }

      if (schoolId !== d.schoolId) {
        const { error: updateError } = await supabaseAdmin
          .from('app_data')
          .update({
            data: { ...d, schoolId, updatedAt: Date.now() },
            updated_at: new Date().toISOString(),
          })
          .eq('id', stu.id)
          .eq('collection', 'students');
        if (updateError) errors++;
        else updated++;
      }
    }

    const hasMore = processed === BATCH;
    log.push(`${processed} diproses, ${updated} diperbarui, ${errors} error`);
    if (hasMore) log.push(`Lanjutkan dengan cursor=${lastId}`);

    return NextResponse.json({
      success: true,
      done: !hasMore,
      nextCursor: hasMore ? lastId : undefined,
      processed,
      updated,
      errors,
      log,
    });
  } catch (error) {
    console.error('[fix-siswa] error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}