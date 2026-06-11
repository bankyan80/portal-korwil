import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://www.portalkorwil.online';
const TOKEN = process.env.AUTH_TOKEN || '';

const sekolahSD = [
  { nama: 'SD NEGERI 1 ASEM', npsn: '20215216', nss: '101021706002', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Abdurachman Saleh No. 328, Asem', desa: 'ASEM', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 BELAWA', npsn: '20215230', nss: '101021706025', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cikuya 1, Belawa', desa: 'BELAWA', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 BELAWA', npsn: '20215564', nss: '101021706026', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Inpres Blok A, Belawa', desa: 'BELAWA', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', nss: '101021706004', status: 'NEGERI', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 07, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', nss: '101021706005', status: 'NEGERI', akreditasi: 'A', address: 'Jl. KH. Hasyim Asyari No. 500, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'SD', dayaTampung: 60 },
  { nama: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', nss: '101021706007', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 62, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', nss: '101021706008', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 3B, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 3 CIPEUJEUH WETAN', npsn: '20214479', nss: '101021706009', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wahid Hasyim No. 66, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 LEMAHABANG', npsn: '20215162', nss: '101021706015', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 35, Lemahabang', desa: 'LEMAHABANG', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 2 LEMAHABANG', npsn: '20214656', nss: '101021706016', status: 'NEGERI', akreditasi: 'A', address: 'Jl. R.A. Kartini No. 26, Lemahabang', desa: 'LEMAHABANG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 LEMAHABANG KULON', npsn: '20215161', nss: '101021706013', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Syech Lemahabang No. 5, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 LEUWIDINGDING', npsn: '20215164', nss: '101021706001', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Abdurahman Saleh, Leuwidingding', desa: 'LEUWIDINGDING', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 PICUNGPUGUR', npsn: '20246442', nss: '101021706023', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Desa Picungpugur, Picungpugur', desa: 'PICUNGPUGUR', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 SARAJAYA', npsn: '20215517', nss: '101021706021', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya No. 63, Sarajaya', desa: 'SARAJAYA', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 2 SARAJAYA', npsn: '20214726', nss: '101021706022', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya Subur No. 1, Sarajaya', desa: 'SARAJAYA', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 SIGONG', npsn: '20215506', nss: '101021706018', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pelita No. 101, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 3 SIGONG', npsn: '20214570', nss: '101021706020', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sigong, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 4 SIGONG', npsn: '20244513', nss: '101021706014', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG', jenjang: 'SD', dayaTampung: 56 },
  { nama: 'SD NEGERI 1 SINDANGLAUT', npsn: '20215464', nss: '101021706011', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Arief Rahman Hakim No. 24, Sindanglaut', desa: 'SINDANGLAUT', jenjang: 'SD', dayaTampung: 80 },
  { nama: 'SD NEGERI 1 TUK KARANGSUWUNG', npsn: '20246445', nss: '101021706024', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pulo Undrus Ujung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG', jenjang: 'SD', dayaTampung: 40 },
  { nama: 'SD NEGERI 1 WANGKELANG', npsn: '20215584', nss: '101021706027', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Wangkelang No. 40, Wangkelang', desa: 'WANGKELANG', jenjang: 'SD', dayaTampung: 56 },
  { nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', npsn: '20215221', nss: '102021706028', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Syech Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'SD', dayaTampung: 160 },
];
const sekolahTK = [
  { nama: 'TK NEGERI LEMAHABANG', npsn: '20270605', nss: '002021706002', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wakhid Hasyim, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK AISYIYAH LEMAHABANG', npsn: '20254372', nss: '002021706003', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 25, Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK AL-AQSO', npsn: '20254376', nss: '002021706008', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Desa Tuk Karangsuwung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK AL-IRSYAD AL-ISLAMIYYAH', npsn: '20254373', nss: '002021706004', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Syekh Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK BPP KENANGA', npsn: '20254374', nss: '002021706006', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Abdurahman Saleh No. 24, Asem', desa: 'ASEM', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK GELATIK', npsn: '20254370', nss: '002021706001', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Raya Dr. Wahidin No. 57A, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK MELATI', npsn: '20254378', nss: '002021706007', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Desa Wangkelang, Wangkelang', desa: 'WANGKELANG', jenjang: 'TK', dayaTampung: 56 },
  { nama: 'TK MUSLIMAT NU', npsn: '20254375', nss: '002021706005', status: 'SWASTA', akreditasi: 'B', address: 'Jl. R.A. Kartini No. 5, Lemahabang', desa: 'LEMAHABANG', jenjang: 'TK', dayaTampung: 56 },
];
const sekolahKB = [
  { nama: 'KB A.H. PLUS', npsn: '70039880', nss: '012021706020', status: 'SWASTA', akreditasi: '-', address: 'Jl. Pelita Dusun 4, Sigong', desa: 'SIGONG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB AMALIA SALSABILA', npsn: '69804039', nss: '012021706017', status: 'SWASTA', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 112, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB AZ-ZAHRA', npsn: '69804068', nss: '012021706012', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Pelita Dusun 02, Sigong', desa: 'SIGONG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB MUTIARA', npsn: '70044538', nss: '012021706019', status: 'SWASTA', akreditasi: '-', address: 'Jl. KH. Hasyim Asyari No. 48, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB PALAPA', npsn: '69870486', nss: '012021706014', status: 'SWASTA', akreditasi: '-', address: 'Jl. Syech Lemahabang, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'KB PERMATA BUNDA', npsn: '70024652', nss: '012021706018', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Palasah Nunggal, Picungpugur', desa: 'PICUNGPUGUR', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AL HAMBRA', npsn: '69947715', nss: '012021706015', status: 'SWASTA', akreditasi: 'C', address: 'Desa Lemahabang, Lemahabang', desa: 'LEMAHABANG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AL-HIDAYAH', npsn: '69870488', nss: '012021706011', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AL-HUSNA', npsn: '69870479', nss: '012021706010', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Mbah Ardisela Desa Asem, Asem', desa: 'ASEM', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AMANAH', npsn: '69870482', nss: '012021706003', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Sidaresmi No. 1, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD AN NAIM', npsn: '69870484', nss: '012021706006', status: 'SWASTA', akreditasi: 'C', address: 'Blok Kliwon, Sindanglaut', desa: 'SINDANGLAUT', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD ASY-SYAFIIYAH', npsn: '69870485', nss: '012021706001', status: 'SWASTA', akreditasi: 'C', address: 'Jl. Stasiun No. 15, Lemahabang Kulon', desa: 'LEMAHABANG KULON', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD BUDGENVIL', npsn: '69870489', nss: '012021706013', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Inpres, Belawa', desa: 'BELAWA', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD TUNAS HARAPAN', npsn: '69870490', nss: '012021706004', status: 'SWASTA', akreditasi: 'C', address: 'Blok Pahing, Wangkelang', desa: 'WANGKELANG', jenjang: 'KB', dayaTampung: 28 },
  { nama: 'PAUD SPS MELATI', npsn: '69804044', nss: '012021706016', status: 'SWASTA', akreditasi: 'C', address: 'Dusun 02, Sarajaya', desa: 'SARAJAYA', jenjang: 'KB', dayaTampung: 28 },
];
const allSekolah = [...sekolahSD, ...sekolahTK, ...sekolahKB];

async function api(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Cookie'] = `auth-token=${TOKEN}`;
  const res = await fetch(url, { ...opts, headers: { ...headers, ...opts.headers } });
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`${url}: ${res.status} ${text.slice(0, 200)}`); }
}

async function getCollection(collection) {
  const all = [];
  const LIMIT = 99999;
  let offset = 0;
  while (true) {
    const { items = [], total } = await api(`${BASE}/api/firestore/${collection}?limit=${LIMIT}&offset=${offset}`);
    if (!items.length) break;
    all.push(...items);
    if (items.length < LIMIT) break;
    offset += LIMIT;
  }
  return all;
}

async function post(collection, id, data) {
  const res = await api(`${BASE}/api/firestore/${collection}`, {
    method: 'POST',
    body: JSON.stringify({ id, data, merge: true }),
  });
  if (!res.success) throw new Error(`${collection}/${id}: ${JSON.stringify(res)}`);
  return res;
}

function normalizeSchoolName(name) {
  return name
    .toLowerCase()
    .replace(/kecamatan\s+lemahabang/gi, '')
    .replace(/[^a-z0-9\s\-\.]/g, '')
    .replace(/\s*-\s*/g, '-')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .replace(/^sdn\s+/, 'sd negeri ')
    .trim();
}

function buildSchoolIndex(schools) {
  const idx = new Map();
  for (const s of schools) {
    const npsn = s.npsn || s.id;
    const original = normalizeSchoolName(s.nama || s.namaSekolah || '');
    idx.set(original, npsn);
    const normalized = original.replace(/^(sd negeri|sd|tk|kb|paud)\s+/, '').trim();
    if (normalized !== original) idx.set(normalized, npsn);
  }
  return idx;
}

function matchSchool(studentNamaSekolah, index) {
  if (!studentNamaSekolah) return null;
  const name = normalizeSchoolName(studentNamaSekolah);
  if (!name) return null;
  const direct = index.get(name);
  if (direct) return direct;
  for (const [key, npsn] of index) {
    if (key.includes(name) || name.includes(key)) return npsn;
  }
  return null;
}

async function main() {
  const log = [];
  console.log('=== SYNC FULL ===\n');

  // 1. Fetch existing data
  console.log('Fetching schools...');
  const apiSchools = await getCollection('schools');
  log.push(`Schools fetched: ${apiSchools.length}`);
  console.log(`  ${apiSchools.length} schools`);

  console.log('Fetching employees...');
  const employees = await getCollection('employees');
  log.push(`Employees fetched: ${employees.length}`);
  console.log(`  ${employees.length} employees`);

  console.log('Fetching students...');
  const students = await getCollection('students');
  log.push(`Students fetched: ${students.length}`);
  console.log(`  ${students.length} students`);

  // Build school index from static data
  const schoolIndex = buildSchoolIndex(allSekolah);
  const schoolByNpsn = new Map(allSekolah.map(s => [s.npsn, s]));

  // 2. Sync employees: match schoolId, detect kepala sekolah
  console.log('\nProcessing employees...');
  let empUpdated = 0, kepalaCount = 0, pltCount = 0;
  for (const emp of employees) {
    const d = emp;
    const namaSekolah = d.namaSekolah || d.sekolah || d.sekolah_asal || '';
    let schoolId = d.schoolId || '';
    if (namaSekolah) {
      const match = matchSchool(namaSekolah, schoolIndex);
      schoolId = match || '';
    } else if (schoolId && !allSekolah.some(s => s.npsn === schoolId)) {
      schoolId = '';
    }

    const updates = {};
    if (schoolId !== d.schoolId) updates.schoolId = schoolId;

    const jabatan = (d.jabatan || '').toLowerCase();
    if (jabatan.includes('kepala') && !jabatan.includes('plt')) {
      updates.isKepalaSekolah = true;
      updates.pltKepalaSekolah = false;
      kepalaCount++;
    }
    if (jabatan.includes('plt') || d.pltKepalaSekolah === true) {
      updates.pltKepalaSekolah = true;
      pltCount++;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await post('employees', emp.id, { ...d, ...updates, updatedAt: Date.now() });
        empUpdated++;
      } catch (e) { log.push(`ERROR emp ${emp.id}: ${e.message}`); }
    }
  }
  log.push(`Employees: ${employees.length} total, ${empUpdated} updated`);
  log.push(`Kepala: ${kepalaCount}, PLT: ${pltCount}`);
  console.log(`  ${empUpdated} updated (${kepalaCount} kepala, ${pltCount} PLT)`);

  // 3. Sync students: match schoolId
  console.log('\nProcessing students...');
  let stuUpdated = 0;
  const STU_BATCH = 50;

  const studentsToUpdate = [];
  for (const stu of students) {
    const d = stu;
    const namaSekolah = d.namaSekolah || d.sekolah || '';
    let schoolId = d.schoolId || '';
    if (namaSekolah) {
      const match = matchSchool(namaSekolah, schoolIndex);
      if (match) schoolId = match;
    }
    if (schoolId !== d.schoolId) {
      studentsToUpdate.push({ id: stu.id, data: { ...d, schoolId, updatedAt: Date.now() } });
    }
  }
  console.log(`  ${studentsToUpdate.length} students need schoolId update`);

  for (let i = 0; i < studentsToUpdate.length; i += STU_BATCH) {
    const batch = studentsToUpdate.slice(i, i + STU_BATCH);
    const results = await Promise.allSettled(batch.map(s => post('students', s.id, s.data)));
    stuUpdated += results.filter(r => r.status === 'fulfilled').length;
    const errs = results.filter(r => r.status === 'rejected');
    for (const e of errs) log.push(`ERROR student batch ${i}: ${e.reason?.message || e.reason}`);
    process.stdout.write(`\r  Students: ${stuUpdated}/${studentsToUpdate.length} (${Math.min(i + STU_BATCH, studentsToUpdate.length)})`);
  }
  log.push(`Students: ${students.length} total, ${stuUpdated} updated`);
  console.log(`\n  ${stuUpdated}/${studentsToUpdate.length} updated`);

  // 4. Regenerate employee_mappings
  console.log('\nRegenerating employee mappings...');
  const freshEmployees = await getCollection('employees');
  const freshStudents = await getCollection('students');

  const employeesBySchool = {};
  const studentsBySchool = {};
  const kepalaBySchool = {};

  for (const e of freshEmployees) {
    const sid = e.schoolId || 'unknown';
    if (!employeesBySchool[sid]) employeesBySchool[sid] = [];
    employeesBySchool[sid].push(e);
    if (e.isKepalaSekolah && e.schoolId) {
      kepalaBySchool[e.schoolId] = { nama: e.nama || '', nip: e.nip || '' };
    }
  }
  for (const s of freshStudents) {
    const sid = s.schoolId || 'unknown';
    if (!studentsBySchool[sid]) studentsBySchool[sid] = [];
    studentsBySchool[sid].push(s);
  }

  let mappingsCreated = 0;
  for (const school of allSekolah) {
    const npsn = school.npsn;
    const pegawai = employeesBySchool[npsn] || [];
    const siswa = studentsBySchool[npsn] || [];
    const totalGuruIdeal = Math.ceil(siswa.filter(s => s.statusSiswa === 'Aktif').length / 20) || 1;
    const totalTendikIdeal = 2;

    const rincian = {};
    for (const p of pegawai.filter(p => p.statusAktif === 'Aktif')) {
      rincian[p.jabatan || 'Lainnya'] = (rincian[p.jabatan || 'Lainnya'] || 0) + 1;
    }

    try {
      await post('employee_mappings', `map_${npsn}`, {
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
      });
      mappingsCreated++;
    } catch (e) { log.push(`ERROR mapping ${npsn}: ${e.message}`); }
  }
  log.push(`Mappings: ${mappingsCreated} schools`);
  console.log(`  ${mappingsCreated} mappings`);

  // 5. Update school counts
  console.log('\nUpdating school counts...');
  const apiSchools2 = await getCollection('schools');
  const schoolDataByNpsn = new Map(apiSchools2.map(s => [s.id || s.npsn, s]));

  let schoolsUpdated = 0;
  for (const school of allSekolah) {
    const npsn = school.npsn;
    const pegawai = employeesBySchool[npsn] || [];
    const siswa = studentsBySchool[npsn] || [];
    const kepala = kepalaBySchool[npsn];
    const existing = schoolDataByNpsn.get(npsn) || {};

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
    const rombelSet = new Set();
    for (const s of siswa) { if (s.rombel) rombelSet.add(s.rombel); }

    const schoolUpdates = { updatedAt: Date.now() };
    if (kepala) {
      schoolUpdates.kepalaSekolah = kepala.nama;
      schoolUpdates.nipKepalaSekolah = kepala.nip || '';
    }
    schoolUpdates.jumlahSiswa = jumlahSiswa;
    schoolUpdates.jumlahRombel = rombelSet.size || 1;
    schoolUpdates.jumlahGuru = jumlahGuru;
    schoolUpdates.jumlahTendik = jumlahTendik;

    try {
      await post('schools', npsn, { ...existing, ...schoolUpdates });
      schoolsUpdated++;
    } catch (e) { log.push(`ERROR school ${npsn}: ${e.message}`); }
  }
  log.push(`Schools updated: ${schoolsUpdated}/${allSekolah.length}`);
  console.log(`  ${schoolsUpdated}/${allSekolah.length} schools`);

  // Summary
  writeFileSync('sync-full-log.json', JSON.stringify(log, null, 2));
  console.log('\n=== SELESAI ===');
  console.log(log.join('\n'));
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
