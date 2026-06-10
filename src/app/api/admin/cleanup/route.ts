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

    // Helper: get all records with pagination
    async function getAllPaginated(collection: string) {
      const all: any[] = [];
      const BATCH = 1000;
      let offset = 0;
      while (true) {
        const { data } = await supabaseAdmin
          .from('app_data')
          .select('*')
          .eq('collection', collection)
          .order('id')
          .range(offset, offset + BATCH - 1);
        if (!data || data.length === 0) break;
        all.push(...data);
        offset += BATCH;
      }
      return all;
    }

    // Cleanup employees: keep records where id === nik, delete older UUID records
    const employees = await getAllPaginated('employees');

    let empDeleted = 0;
    if (employees?.length) {
      for (const emp of employees) {
        const nik = (emp.data as any)?.nik;
        if (nik && emp.id !== nik) {
          await supabaseAdmin.from('app_data').delete().eq('id', emp.id).eq('collection', 'employees');
          empDeleted++;
        }
      }
    }
    log.push(`Employees: ${employees?.length || 0} total, ${empDeleted} deleted`);

    // Cleanup students: group by nisn, keep one record per nisn
    const students = await getAllPaginated('students');

    let stuDeleted = 0;
    if (students?.length) {
      const nisnGroups = new Map<string, any[]>();
      for (const stu of students) {
        const nisn = (stu.data as any)?.nisn || (stu.data as any)?.nik || '';
        if (!nisn) continue;
        if (!nisnGroups.has(nisn)) nisnGroups.set(nisn, []);
        nisnGroups.get(nisn)!.push(stu);
      }

      for (const [, records] of nisnGroups) {
        if (records.length <= 1) continue;
        const keep = records.find(r => r.id === (r.data as any)?.nisn || r.id === (r.data as any)?.nik);
        for (const r of records) {
          if (r !== keep) {
            await supabaseAdmin.from('app_data').delete().eq('id', r.id).eq('collection', 'students');
            stuDeleted++;
          }
        }
      }

      // Delete UUID records with no nisn/nik
      const uuidPattern = /^[0-9a-f-]{36}$/;
      for (const stu of students) {
        const nisn = (stu.data as any)?.nisn || (stu.data as any)?.nik || '';
        if (!nisn && uuidPattern.test(stu.id)) {
          await supabaseAdmin.from('app_data').delete().eq('id', stu.id).eq('collection', 'students');
          stuDeleted++;
        }
      }
    }
    log.push(`Students: ${students?.length || 0} total, ${stuDeleted} deleted`);

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('[cleanup] error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
