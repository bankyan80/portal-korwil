import fs from 'fs';

const API_BASE = 'https://www.portalkorwil.online/api/firestore';
const BATCH = 50;

function loadJSON(p: string): any[] {
  const raw = fs.readFileSync(p, 'utf-8');
  // Strip BOM if present
  const cleaned = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
  return JSON.parse(cleaned);
}

async function upsert(collection: string, items: { id: string; data: any }[]) {
  console.log(`\n=== ${collection}: ${items.length} items ===`);
  let ok = 0, fail = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(item =>
        fetch(`${API_BASE}/${collection}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, data: item.data, merge: true }),
        }).then(async r => {
          if (!r.ok) {
            const body = await r.text();
            throw new Error(`${r.status} ${r.statusText} — ${body.slice(0, 100)}`);
          }
          return r.json();
        })
      )
    );
    for (const r of results) {
      if (r.status === 'fulfilled') ok++;
      else { fail++; console.error('  FAIL:', (r.reason as Error).message); }
    }
    console.log(`  ${i + batch.length}/${items.length} (ok:${ok} fail:${fail})`);
  }
  console.log(`  ✓ ${collection}: ${ok} ok, ${fail} fail`);
}

async function main() {
  // 1. SYNC SCHOOLS
  const rawSchools = loadJSON('C:\\Users\\Bank Yan\\simpeg-tim\\data-sekolah.json');
  const schoolItems = rawSchools.map((s: any) => ({
    id: `school-${s.npsn}`,
    data: {
      namaSekolah: s.nama,
      npsn: s.npsn,
      jenjang: s.jenjang || 'SD',
      statusSekolah: s.status?.charAt(0).toUpperCase() + s.status?.slice(1).toLowerCase() || 'Negeri',
      alamat: s.address || '',
      desa: s.desa || '',
      kecamatan: 'Lemahabang',
      isActive: true,
      bentukSatuan: 'Sekolah',
    }
  }));
  await upsert('schools', schoolItems);

  // 2. SYNC EMPLOYEES
  const rawPegawai = loadJSON('C:\\Users\\Bank Yan\\simpeg-tim\\data-pegawai.json');
  const statusMap: Record<string, string> = {
    'PNS': 'PNS',
    'PPPK': 'PPPK',
    'PTK': 'Honorer',
    'GTT': 'GTT',
    'Honorer': 'Honorer',
  };
  const jabatanMap: Record<string, string> = {
    'Guru': 'Guru Kelas',
    'Kepala Sekolah': 'Kepala Sekolah',
    'Tendik': 'Tendik',
    'Operator': 'Operator',
  };
  const pegawaiItems = rawPegawai.map((p: any) => ({
    id: p.nik,
    data: {
      nik: p.nik,
      nama: p.nama || '',
      jenisKelamin: p.jk || 'L',
      nuptk: p.nuptk || '',
      nip: p.nip || '',
      tanggalLahir: p.tanggal_lahir || '',
      statusPegawai: statusMap[p.status_kepegawaian] || p.status_kepegawaian || 'Honorer',
      jabatan: jabatanMap[p.jenis_ptk] || p.jenis_ptk || 'Guru Kelas',
      sertifikasi: p.sertifikasi || '',
      tmtKerja: p.tmt || '',
      namaSekolah: p.sekolah || '',
      statusAktif: 'Aktif',
      pendidikanTerakhir: 'S1',
    }
  }));
  await upsert('employees', pegawaiItems);

  // 3. SYNC PLT — set jabatan = 'Kepala Sekolah' for plt employees
  const rawPlt = loadJSON('C:\\Users\\Bank Yan\\simpeg-tim\\data-plt.json');
  const pltItems: { id: string; data: any }[] = [];
  for (const plt of rawPlt) {
    const employee = rawPegawai.find((p: any) => p.nama === plt.plt_nama || p.nip === plt.plt_nip);
    if (employee) {
      pltItems.push({
        id: employee.nik,
        data: {
          jabatan: 'Kepala Sekolah',
          namaSekolah: plt.sekolah,
        }
      });
    } else {
      // PLT might not be in pegawai list, create a minimal record
      const pltNik = `plt-${plt.npsn}`;
      pltItems.push({
        id: pltNik,
        data: {
          nik: pltNik,
          nama: plt.plt_nama || '',
          nip: plt.plt_nip || '',
          jabatan: 'Kepala Sekolah',
          namaSekolah: plt.sekolah || '',
          statusPegawai: 'PNS',
          statusAktif: 'Aktif',
          jenisKelamin: 'L',
          pendidikanTerakhir: 'S1',
        }
      });
    }
  }
  if (pltItems.length) {
    await upsert('employees', pltItems);
  }

  // 4. SYNC STUDENTS
  console.log('\n=== Loading students (large file)... ===');
  const rawSiswa = loadJSON('C:\\Users\\Bank Yan\\simdawa\\data\\data-siswa.json');
  const siswaItems = rawSiswa.map((s: any) => ({
    id: s.nisn || s.nik || `std-${Math.random().toString(36).slice(2)}`,
    data: {
      nama: s.nama || '',
      jenisKelamin: s.jk === 'Laki-laki' ? 'L' : s.jk === 'Perempuan' ? 'P' : (s.jk || 'L'),
      nisn: s.nisn || '',
      nik: s.nik || '',
      tempatLahir: s.tempat_lahir || '',
      tanggalLahir: s.tanggal_lahir || '',
      agama: s.agama || 'Islam',
      alamat: s.alamat || '',
      desa: s.desa || '',
      kecamatan: s.kecamatan || 'Lemahabang',
      kelas: s.kelas || '',
      kelompok: s.kelas || '',
      rombel: s.rombel || '',
      namaAyah: s.data_ayah?.nama || '',
      namaIbu: s.data_ibu?.nama || '',
      jenjang: s.jenjang || 'SD',
      namaSekolah: s.sekolah || '',
      statusSiswa: 'Aktif',
    }
  }));
  await upsert('students', siswaItems);

  console.log('\n✅ Sync complete!');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
