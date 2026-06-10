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

    const log: string[] = [];

    // 1. Seed schools from static data (NPSN as ID)
    let seededSchools = 0;
    const schoolIdMap: Record<string, string> = {}; // nama -> npsn

    for (const school of allSekolah) {
      const npsn = school.npsn;
      schoolIdMap[school.nama.toLowerCase()] = npsn;

      const { error } = await supabaseAdmin
        .from('app_data')
        .upsert({
          id: npsn,
          collection: 'schools',
          data: {
            namaSekolah: school.nama,
            npsn,
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
      if (!error) seededSchools++;
    }
    log.push(`Seed sekolah: ${seededSchools}/${allSekolah.length}`);

    // Helper: get all records with cursor-based pagination
    async function getAllPaginated(collection: string) {
      const all: any[] = [];
      const BATCH = 1000;
      let lastId = '';
      while (true) {
        let query = supabaseAdmin
          .from('app_data')
          .select('*')
          .eq('collection', collection)
          .order('id')
          .limit(BATCH);
        if (lastId) query = query.gt('id', lastId);
        const { data, error } = await query;
        if (error) { console.error(`[getAllPaginated] ${collection}:`, error); break; }
        if (!data || data.length === 0) break;
        all.push(...data);
        lastId = data[data.length - 1].id;
      }
      return all;
    }

    // 2. Sync employees: match schoolId by name fallback
    const existingEmployees = await getAllPaginated('employees');

    let mappedEmployees = 0;
    let kepalaSekolah = 0;
    let pltKepalaSekolah = 0;

    if (existingEmployees?.length) {
      for (const emp of existingEmployees) {
        const d = emp.data as Record<string, any>;
        let schoolId = d.schoolId || '';

        // If schoolId doesn't match any seeded school, try by name
        if (schoolId && !allSekolah.some(s => s.npsn === schoolId)) {
          const nameKey = (d.namaSekolah || d.sekolah || '').toLowerCase();
          const match = schoolIdMap[nameKey];
          if (match) {
            schoolId = match;
          } else {
            // Try partial match
            for (const [key, npsn] of Object.entries(schoolIdMap)) {
              if (nameKey.includes(key) || key.includes(nameKey)) {
                schoolId = npsn;
                break;
              }
            }
          }
        }

        // Default to first SD school if still no match
        if (!schoolId) {
          const defaultSd = allSekolah.find(s => s.jenjang === 'SD');
          if (defaultSd) schoolId = defaultSd.npsn;
        }

        const updates: Record<string, any> = {};
        if (schoolId !== d.schoolId) {
          updates.schoolId = schoolId;
        }

        // Detect kepala sekolah
        const jabatan = (d.jabatan || '').toLowerCase();
        if (jabatan.includes('kepala') && !jabatan.includes('plt')) {
          updates.isKepalaSekolah = true;
          updates.pltKepalaSekolah = false;
          kepalaSekolah++;
        }

        // Detect plt kepala sekolah
        if (jabatan.includes('plt') || d.pltKepalaSekolah === true) {
          updates.pltKepalaSekolah = true;
          pltKepalaSekolah++;
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabaseAdmin
            .from('app_data')
            .update({
              data: { ...d, ...updates, updatedAt: Date.now() },
              updated_at: new Date().toISOString(),
            })
            .eq('id', emp.id)
            .eq('collection', 'employees');
          if (!error) mappedEmployees++;
        }
      }
    }
    log.push(`Pegawai: ${existingEmployees?.length || 0} total, ${mappedEmployees} diperbarui`);
    log.push(`Kepala Sekolah: ${kepalaSekolah} teridentifikasi`);
    log.push(`Plt. Kepala Sekolah: ${pltKepalaSekolah} teridentifikasi`);

    // 3. Sync students: match schoolId by name fallback
    const existingStudents = await getAllPaginated('students');

    let mappedStudents = 0;

    if (existingStudents?.length) {
      for (const stu of existingStudents) {
        const d = stu.data as Record<string, any>;
        let schoolId = d.schoolId || '';

        if (schoolId && !allSekolah.some(s => s.npsn === schoolId)) {
          const nameKey = (d.namaSekolah || d.sekolah || '').toLowerCase();
          const match = schoolIdMap[nameKey];
          if (match) {
            schoolId = match;
          } else {
            for (const [key, npsn] of Object.entries(schoolIdMap)) {
              if (nameKey.includes(key) || key.includes(nameKey)) {
                schoolId = npsn;
                break;
              }
            }
          }
        }

        if (!schoolId) {
          const defaultSd = allSekolah.find(s => s.jenjang === 'SD');
          if (defaultSd) schoolId = defaultSd.npsn;
        }

        if (schoolId !== d.schoolId) {
          const { error } = await supabaseAdmin
            .from('app_data')
            .update({
              data: { ...d, schoolId, updatedAt: Date.now() },
              updated_at: new Date().toISOString(),
            })
            .eq('id', stu.id)
            .eq('collection', 'students');
          if (!error) mappedStudents++;
        }
      }
    }
    log.push(`Siswa: ${existingStudents?.length || 0} total, ${mappedStudents} diperbarui`);

    // 4. Sync employee_mappings (regenerate from fresh data)
    const freshEmployees = await getAllPaginated('employees');
    const freshStudents = await getAllPaginated('students');

    const employeesBySchool: Record<string, any[]> = {};
    const studentsBySchool: Record<string, any[]> = {};

    for (const e of freshEmployees || []) {
      const d = e.data as Record<string, any>;
      const sid = d.schoolId || 'unknown';
      if (!employeesBySchool[sid]) employeesBySchool[sid] = [];
      employeesBySchool[sid].push(d);
    }
    for (const s of freshStudents || []) {
      const d = s.data as Record<string, any>;
      const sid = d.schoolId || 'unknown';
      if (!studentsBySchool[sid]) studentsBySchool[sid] = [];
      studentsBySchool[sid].push(d);
    }

    let mappingsCreated = 0;
    for (const school of allSekolah) {
      const npsn = school.npsn;
      const pegawai = employeesBySchool[npsn] || [];
      const siswa = studentsBySchool[npsn] || [];
      const totalGuruIdeal = Math.ceil(siswa.filter(s => s.statusSiswa === 'Aktif').length / 20) || 1;
      const totalTendikIdeal = 2;

      const rincian: Record<string, number> = {};
      for (const p of pegawai.filter(p => p.statusAktif === 'Aktif')) {
        rincian[p.jabatan || 'Lainnya'] = (rincian[p.jabatan || 'Lainnya'] || 0) + 1;
      }

      const { error } = await supabaseAdmin
        .from('app_data')
        .upsert({
          id: `map_${npsn}`,
          collection: 'employee_mappings',
          data: {
            schoolId: npsn,
            namaSekolah: school.nama,
            jenjang: school.jenjang,
            npsn,
            totalPegawaiTersedia: pegawai.filter(p => p.statusAktif === 'Aktif').length,
            totalPegawaiAktif: pegawai.filter(p => p.statusAktif === 'Aktif').length,
            totalKebutuhanIdeal: totalGuruIdeal + totalTendikIdeal,
            totalGuruIdeal,
            totalTendikIdeal,
            totalSiswaAktif: siswa.filter(s => s.statusSiswa === 'Aktif').length,
            rincianJabatan: rincian,
            updatedAt: Date.now(),
          },
        });
      if (!error) mappingsCreated++;
    }
    log.push(`Mapping pegawai: ${mappingsCreated} sekolah diperbarui`);

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('[sync-data] error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
