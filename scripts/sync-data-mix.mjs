import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://www.portalkorwil.online';
const TOKEN = process.env.AUTH_TOKEN || '';

async function post(collection, id, data) {
  const url = `${BASE}/api/firestore/${collection}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth-token=${TOKEN}`,
    },
    body: JSON.stringify({ id, data, merge: true }),
  });
  const json = await res.json();
  if (!res.ok && !json.success) throw new Error(`${collection}/${id}: ${res.status} ${JSON.stringify(json)}`);
  return json;
}

const load = (file) => JSON.parse(readFileSync(join(__dirname, '..', 'data_mix', file), 'utf-8').replace(/^\uFEFF/, ''));

async function main() {
  const log = [];

  // 1. Sync sekolah
  const sekolahList = load('data-sekolah.json');
  let sekCount = 0;
  for (const s of sekolahList) {
    try {
      await post('schools', s.npsn, {
        namaSekolah: s.nama,
        npsn: s.npsn,
        nss: s.nss,
        jenjang: s.jenjang,
        statusSekolah: s.status === 'NEGERI' ? 'Negeri' : 'Swasta',
        akreditasi: s.akreditasi,
        alamat: s.address,
        desa: s.desa,
        dayaTampung: s.dayaTampung,
        isActive: true,
        updatedAt: Date.now(),
      });
      sekCount++;
    } catch (e) { log.push(`ERROR sekolah ${s.npsn}: ${e.message}`); }
  }
  log.push(`Sekolah: ${sekCount}/${sekolahList.length}`);

  // 2. Sync PLT (special collection or update sekolah?)
  const pltList = load('data-plt.json');
  let pltCount = 0;
  for (const p of pltList) {
    try {
      await post('employees', `plt_${p.npsn}`, {
        nama: p.plt_nama,
        nip: p.plt_nip,
        sekolah: p.sekolah,
        npsn: p.npsn,
        pltKepalaSekolah: true,
        pltDari: p.plt_dari,
        statusAktif: 'Aktif',
        updatedAt: Date.now(),
      });
      pltCount++;
    } catch (e) { log.push(`ERROR plt ${p.npsn}: ${e.message}`); }
  }
  log.push(`PLT: ${pltCount}/${pltList.length}`);

  // 3. Sync pegawai (NIK as ID)
  const pegawaiList = load('data-pegawai.json');
  let pgwCount = 0;
  for (const p of pegawaiList) {
    try {
      const id = String(p.nik || p.nip || `peg_${Math.random().toString(36).slice(2)}`);
      await post('employees', id, {
        nik: String(p.nik || ''),
        nama: p.nama,
        jk: p.jk,
        nuptk: p.nuptk || '',
        tanggalLahir: p.tanggal_lahir || '',
        nip: p.nip || '',
        statusKepegawaian: p.status_kepegawaian || '',
        jenisPtk: p.jenis_ptk || '',
        tugasTambahan: p.tugas_tambahan || '',
        sertifikasi: p.sertifikasi || '',
        tmt: p.tmt || '',
        sekolah: p.sekolah || '',
        role: p.role || '',
        statusAktif: 'Aktif',
        updatedAt: Date.now(),
      });
      pgwCount++;
    } catch (e) { log.push(`ERROR pegawai ${p.nik || p.nama}: ${e.message}`); }
  }
  log.push(`Pegawai: ${pgwCount}/${pegawaiList.length}`);

  // 4. Sync siswa (NISN as ID)
  const siswaList = load('data-siswa.json');
  let sisCount = 0;
  const BATCH = 50;
  for (let i = 0; i < siswaList.length; i += BATCH) {
    const batch = siswaList.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(async (s) => {
      const id = String(s.nisn || s.nik_asli || s.nik || `sis_${Math.random().toString(36).slice(2)}`);
      await post('students', id, {
        nik: String(s.nik || s.nik_asli || ''),
        nisn: String(s.nisn || ''),
        nama: s.nama,
        jk: s.jk,
        jenisKelamin: s.jk === 'L' ? 'L' : 'P',
        tempatLahir: s.tempat_lahir || '',
        tanggalLahir: s.tanggal_lahir || '',
        agama: s.agama || '',
        alamat: s.alamat || '',
        rt: s.rt || '',
        rw: s.rw || '',
        dusun: s.dusun || '',
        desa: s.desa || '',
        kecamatan: s.kecamatan || '',
        kodePos: s.kode_pos || '',
        jenisTinggal: s.jenis_tinggal || '',
        alatTransportasi: s.alat_transportasi || '',
        telepon: s.telepon || '',
        hp: s.hp || '',
        email: s.email || '',
        sekolah: s.sekolah || '',
        jenjang: s.jenjang || '',
        npsn: String(s.npsn || ''),
        rombel: s.rombel || '',
        kelas: s.kelas != null ? Number(s.kelas) : null,
        dataAyah: s.data_ayah || null,
        dataIbu: s.data_ibu || null,
        dataWali: s.data_wali || null,
        penerimaKps: s.penerima_kps || 'Tidak',
        noKps: s.no_kps || '',
        penerimaKip: s.penerima_kip || 'Tidak',
        nomorKip: s.nomor_kip || '',
        namaDiKip: s.nama_di_kip || '',
        layakPip: s.layak_pip || 'Tidak',
        alasanLayakPip: s.alasan_layak_pip || '',
        kebutuhanKhusus: s.kebutuhan_khusus || '',
        sekolahAsal: s.sekolah_asal || '',
        anakKe: s.anak_ke != null ? Number(s.anak_ke) : null,
        noKk: s.no_kk || '',
        beratBadan: s.berat_badan != null ? Number(s.berat_badan) : null,
        tinggiBadan: s.tinggi_badan != null ? Number(s.tinggi_badan) : null,
        lingkarKepala: s.lingkar_kepala != null ? Number(s.lingkar_kepala) : null,
        jumlahSaudara: s.jumlah_saudara != null ? Number(s.jumlah_saudara) : null,
        jarakRumahKm: s.jarak_rumah_km != null ? Number(s.jarak_rumah_km) : null,
        noRegAktaLahir: s.no_reg_akta_lahir || '',
        noPesertaUjian: s.no_peserta_ujian || '',
        noSeriIjazah: s.no_seri_ijazah || '',
        statusSiswa: 'Aktif',
        updatedAt: Date.now(),
      });
    }));
    sisCount += results.filter(r => r.status === 'fulfilled').length;
    const errs = results.filter(r => r.status === 'rejected');
    for (const e of errs) log.push(`ERROR siswa batch ${i}: ${e.reason?.message || e.reason}`);
    process.stdout.write(`\rSiswa: ${sisCount}/${siswaList.length} (${Math.min(i + BATCH, siswaList.length)})`);
  }
  log.push(`\nSiswa: ${sisCount}/${siswaList.length}`);

  writeFileSync('sync-data-mix-log.json', JSON.stringify(log, null, 2));
  console.log('\nSelesai. Log: sync-data-mix-log.json');
  console.log(log.join('\n'));
}

main().catch(console.error);
