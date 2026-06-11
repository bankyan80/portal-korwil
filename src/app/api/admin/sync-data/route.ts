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

    const log: string[] = [];
    const schoolIndex = buildSchoolIndex(allSekolah);

    // 1. Seed schools from static data (NPSN as ID)
    let seededSchools = 0;

    for (const school of allSekolah) {
      const npsn = school.npsn;

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

    // 2. Sync employees: match schoolId by name
    const existingEmployees = await getAllPaginated('employees');

    let mappedEmployees = 0;
    let kepalaSekolah = 0;
    let pltKepalaSekolah = 0;

    if (existingEmployees?.length) {
      for (const emp of existingEmployees) {
        const d = emp.data as Record<string, any>;
        const namaSekolah = d.namaSekolah || d.sekolah || '';
        let schoolId = d.schoolId || '';

        if (namaSekolah) {
          const match = matchStudentSchool(namaSekolah, allSekolah, schoolIndex);
          schoolId = match || '';
        } else if (schoolId && !allSekolah.some(s => s.npsn === schoolId)) {
          schoolId = '';
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

    // 3. Sync students: match schoolId by name
    const existingStudents = await getAllPaginated('students');

    let mappedStudents = 0;

    if (existingStudents?.length) {
      for (const stu of existingStudents) {
        const d = stu.data as Record<string, any>;
        const namaSekolah = d.namaSekolah || d.sekolah || '';
        let schoolId = '';

        if (namaSekolah) {
          const match = matchStudentSchool(namaSekolah, allSekolah, schoolIndex);
          if (match) schoolId = match;
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

    // 5. Sync kepala sekolah & data satuan pendidikan ke record sekolah
    const existingSchools = await getAllPaginated('schools');
    const schoolDataByNpsn: Record<string, Record<string, any>> = {};
    for (const s of existingSchools || []) {
      schoolDataByNpsn[s.id] = s.data as Record<string, any>;
    }

    const kepalaBySchool: Record<string, { nama: string; nip: string }> = {};
    for (const e of freshEmployees || []) {
      const d = e.data as Record<string, any>;
      if (d.isKepalaSekolah && d.schoolId) {
        kepalaBySchool[d.schoolId] = { nama: d.nama || '', nip: d.nip || '' };
      }
    }

    let schoolsUpdated = 0;
    for (const school of allSekolah) {
      const npsn = school.npsn;
      const pegawai = employeesBySchool[npsn] || [];
      const siswa = studentsBySchool[npsn] || [];
      const kepala = kepalaBySchool[npsn];
      const existing = schoolDataByNpsn[npsn] || {};

      const jumlahSiswa = siswa.filter(s => s.statusSiswa === 'Aktif').length;

      const aktif = pegawai.filter(p => p.statusAktif === 'Aktif');
      const jumlahGuru = aktif.filter(p => {
        const j = (p.jabatan || '').toLowerCase();
        const jk = (p.jenis_ptk || '').toLowerCase();
        const r = (p.role || '').toLowerCase();
        if (j.includes('tenaga') || jk === 'tenaga kependidikan' || r === 'tendik') return false;
        return j.includes('guru') || jk === 'guru' || r === 'guru' || p.isKepalaSekolah === true;
      }).length;
      const jumlahTendik = aktif.filter(p => {
        const j = (p.jabatan || '').toLowerCase();
        const jk = (p.jenis_ptk || '').toLowerCase();
        const r = (p.role || '').toLowerCase();
        return j.includes('tenaga') || jk === 'tenaga kependidikan' || r === 'tendik';
      }).length;
      const rombelSet = new Set<string>();
      for (const s of siswa) { if (s.rombel) rombelSet.add(s.rombel); }

      const schoolUpdates: Record<string, any> = {
        updatedAt: Date.now(),
      };

      if (kepala) {
        schoolUpdates.kepalaSekolah = kepala.nama;
        schoolUpdates.nipKepalaSekolah = kepala.nip || '';
      }
      schoolUpdates.jumlahSiswa = jumlahSiswa;
      schoolUpdates.jumlahRombel = rombelSet.size || 1;
      schoolUpdates.jumlahGuru = jumlahGuru;
      schoolUpdates.jumlahTendik = jumlahTendik;

      const { error } = await supabaseAdmin
        .from('app_data')
        .update({
          data: { ...existing, ...schoolUpdates },
          updated_at: new Date().toISOString(),
        })
        .eq('id', npsn)
        .eq('collection', 'schools');
      if (!error) schoolsUpdated++;
    }
    log.push(`Data satuan pendidikan: ${schoolsUpdated} sekolah diperbarui`);
    log.push(`Kepala sekolah tersync: ${Object.keys(kepalaBySchool).length} sekolah`);

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('[sync-data] error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
