import { readFileSync, writeFileSync, existsSync } from 'fs';

const CSV = readFileSync(new URL('../src/data/kb-permata-bunda.csv', import.meta.url), 'utf-8');

// Parse CSV (handling quoted fields)
function parseCSV(text) {
  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
      } else if (ch === '\r') {
        // skip
      } else if (ch === '\n') {
        current.push(field.trim());
        field = '';
        if (current.length > 0 && current.some(c => c)) {
          rows.push(current);
        }
        current = [];
      } else {
        field += ch;
      }
    }
  }
  if (field || current.length > 0) {
    current.push(field.trim());
    if (current.some(c => c)) rows.push(current);
  }
  return rows;
}

const rows = parseCSV(CSV);
console.log('Total CSV rows:', rows.length);
console.log('Row 0 (title):', rows[0]?.[0]);
console.log('Row 1 (school):', rows[1]?.[0]);
console.log('Row 4 (header):', rows[4]?.slice(0, 24));
console.log('Row 5 (sub-header):', rows[5]?.slice(0, 24));

// Data starts from row 6 (after title, school, region, date, header, sub-header)
const dataRows = rows.slice(6);
console.log('Data rows:', dataRows.length);

const SISWA_JSON_PATH = new URL('../src/data/data-siswa.json', import.meta.url);
const existing = JSON.parse(readFileSync(SISWA_JSON_PATH, 'utf-8'));
console.log('Existing students:', existing.length);

let added = 0;
let skipped = 0;

for (const r of dataRows) {
  const nik = (r[7] || '').trim();
  if (!nik) { skipped++; continue; }

  // Check if already exists
  if (existing.some(s => s.nik === nik)) { skipped++; continue; }

  // Parse CSV columns (0-indexed):
  // 0=No, 1=Nama, 2=NIPD, 3=JK, 4=NISN, 5=Tempat Lahir, 6=Tanggal Lahir, 7=NIK,
  // 8=Agama, 9=Alamat, 10=RT, 11=RW, 12=Dusun, 13=Kelurahan, 14=Kecamatan, 15=Kode Pos,
  // 16=Jenis Tinggal, 17=Alat Transportasi, 18=Telepon, 19=HP, 20=E-Mail, 21=SKHUN,
  // 22=Penerima KPS, 23=No. KPS,
  // 24=Nama Ayah, 25=Tahun Lahir Ayah, 26=Jenjang Ayah, 27=Pekerjaan Ayah, 28=Penghasilan Ayah, 29=NIK Ayah,
  // 30=Nama Ibu, 31=Tahun Lahir Ibu, 32=Jenjang Ibu, 33=Pekerjaan Ibu, 34=Penghasilan Ibu, 35=NIK Ibu,
  // 36=Nama Wali, 37=Tahun Lahir Wali, 38=Jenjang Wali, 39=Pekerjaan Wali, 40=Penghasilan Wali, 41=NIK Wali,
  // 42=Rombel, 43=No Peserta UN, 44=No Seri Ijazah,
  // 45=Penerima KIP, 46=Nomor KIP, 47=Nama di KIP, 48=Nomor KKS,
  // 49=No Reg Akta Lahir, 50=Bank, 51=No Rekening, 52=Rekening Atas Nama,
  // 53=Layak PIP, 54=Alasan Layak PIP, 55=Kebutuhan Khusus, 56=Sekolah Asal,
  // 57=Anak ke-, 58=Lintang, 59=Bujur, 60=No KK,
  // 61=Berat Badan, 62=Tinggi Badan, 63=Lingkar Kepala,
  // 64=Jml Saudara, 65=Jarak Rumah

  const entry = {
    nik: nik,
    nama: (r[1] || '').toUpperCase().trim(),
    nipd: (r[2] || '').trim(),
    jk: (r[3] || '').trim().toUpperCase(),
    nisn: (r[4] || '').trim(),
    tempat_lahir: (r[5] || '').trim().toUpperCase(),
    tanggal_lahir: (r[6] || '').trim(),
    nik_asli: nik,
    agama: (r[8] || '').trim(),
    alamat: (r[9] || '').trim(),
    rt: (r[10] || '').trim(),
    rw: (r[11] || '').trim(),
    dusun: (r[12] || '').trim(),
    desa: (r[13] || '').trim().replace(/^(Desa\/Kel\.\s*)/i, ''),
    kecamatan: (r[14] || '').trim(),
    kode_pos: (r[15] || '').trim(),
    jenis_tinggal: (r[16] || '').trim(),
    alat_transportasi: (r[17] || '').trim(),
    telepon: (r[18] || '').trim(),
    hp: (r[19] || '').trim(),
    email: (r[20] || '').trim(),
    skhun: (r[21] || '').trim(),
    penerima_kps: (r[22] || '').trim() || 'Tidak',
    no_kps: (r[23] || '').trim(),
    data_ayah: {
      nama: (r[24] || '').trim().toUpperCase() || '',
      tahun_lahir: (r[25] || '').trim() || '',
      pendidikan: (r[26] || '').trim() || '',
      pekerjaan: (r[27] || '').trim() || '',
      penghasilan: (r[28] || '').trim() || '',
      nik: (r[29] || '').trim() || '',
    },
    data_ibu: {
      nama: (r[30] || '').trim().toUpperCase() || '',
      tahun_lahir: (r[31] || '').trim() || '',
      pendidikan: (r[32] || '').trim() || '',
      pekerjaan: (r[33] || '').trim() || '',
      penghasilan: (r[34] || '').trim() || '',
      nik: (r[35] || '').trim() || '',
    },
    data_wali: null,
    rombel: (r[42] || '').trim(),
    kelas: 1,
    no_peserta_ujian: (r[43] || '').trim(),
    no_seri_ijazah: (r[44] || '').trim(),
    penerima_kip: (r[45] || '').trim() || 'Tidak',
    nomor_kip: (r[46] || '').trim(),
    nama_di_kip: (r[47] || '').trim() || '0',
    nomor_kks: (r[48] || '').trim(),
    no_reg_akta_lahir: (r[49] || '').trim(),
    bank: (r[50] || '').trim(),
    nomor_rekening: (r[51] || '').trim(),
    rekening_atas_nama: (r[52] || '').trim(),
    layak_pip: (r[53] || '').trim() || 'Tidak',
    alasan_layak_pip: (r[54] || '').trim(),
    kebutuhan_khusus: (r[55] || '').trim() || 'Tidak ada',
    sekolah_asal: (r[56] || '').trim(),
    anak_ke: parseInt(r[57]) || 0,
    lintang: parseFloat(r[58]) || 0,
    bujur: parseFloat(r[59]) || 0,
    no_kk: (r[60] || '').trim(),
    berat_badan: parseInt(r[61]) || 0,
    tinggi_badan: parseInt(r[62]) || 0,
    lingkar_kepala: parseInt(r[63]) || 0,
    jumlah_saudara: parseInt(r[64]) || 0,
    jarak_rumah_km: parseFloat(r[65]) || 0,
    sekolah: 'PERMATA BUNDA',
    jenjang: 'KB',
    npsn: '70024652',
  };

  // Check for data_wali
  if (r[36] && r[36].trim()) {
    entry.data_wali = {
      nama: (r[36] || '').trim().toUpperCase() || '',
      tahun_lahir: (r[37] || '').trim() || '',
      pendidikan: (r[38] || '').trim() || '',
      pekerjaan: (r[39] || '').trim() || '',
      penghasilan: (r[40] || '').trim() || '',
      nik: (r[41] || '').trim() || '',
    };
  }

  existing.push(entry);
  added++;
}

writeFileSync(SISWA_JSON_PATH, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`\nDone. Added: ${added}, Skipped (no NIK/duplicate): ${skipped}`);
console.log(`Total students now: ${existing.length}`);
