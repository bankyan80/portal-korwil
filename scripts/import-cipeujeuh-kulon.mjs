import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'path';

// Parse CSV line with proper handling of quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Read file and parse CSV
function parseCSV(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header rows (first 5 rows), row 6 is the CSV header
  const headerLine = lines[4]; // line index 4 = row 5
  const headers = parseCSVLine(headerLine);
  
  const data = [];
  for (let i = 5; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length > 0 && values[0] && !isNaN(parseInt(values[0]))) {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || '';
      });
      data.push(obj);
    }
  }
  
  return data;
}

// Read existing data
const existingData = JSON.parse(readFileSync('src/data/data-pegawai.json', 'utf-8'));

// Parse Guru CSV
const guruData = parseCSV('guru.csv');
console.log(`Found ${guruData.length} guru entries`);

// Parse Tendik CSV
const tendikData = parseCSV('tendik.csv');
console.log(`Found ${tendikData.length} tendik entries`);

// Map to target format
function mapPegawai(record, role) {
  const nik = record['NIK'] || '';
  const nama = (record['Nama'] || '').trim();
  const nuptk = (record['NUPTK'] || '').trim();
  const jk = (record['JK'] || '').trim().toUpperCase();
  const tanggalLahir = (record['Tanggal Lahir'] || '').trim();
  const nip = (record['NIP'] || '').trim();
  const statusKepegawaian = (record['Status Kepegawaian'] || '').trim();
  const jenisPtk = (record['Jenis PTK'] || '').trim();
  
  let tugasTambahan = (record['Tugas Tambahan'] || '').trim();
  if (!tugasTambahan && jenisPtk === 'Kepala Sekolah') {
    tugasTambahan = 'Kepala Sekolah';
  }
  
  return {
    nik,
    nama,
    jk,
    nuptk,
    tanggal_lahir: tanggalLahir,
    nip,
    status_kepegawaian: statusKepegawaian,
    jenis_ptk: jenisPtk,
    tugas_tambahan: tugasTambahan,
    sertifikasi: '',
    sekolah: 'SD NEGERI 1 CIPEUJEUH KULON',
    role
  };
}

// Check duplicates by NIK
const existingNiks = new Set(existingData.map(d => d.nik));

const newData = [];

// Process Guru
for (const guru of guruData) {
  const pegawai = mapPegawai(guru, 'guru');
  if (existingNiks.has(pegawai.nik)) {
    console.log(`SKIP (duplicate NIK): ${pegawai.nama} - ${pegawai.nik}`);
  } else {
    newData.push(pegawai);
    existingNiks.add(pegawai.nik);
  }
}

// Process Tendik
for (const tendik of tendikData) {
  const pegawai = mapPegawai(tendik, 'tendik');
  if (existingNiks.has(pegawai.nik)) {
    console.log(`SKIP (duplicate NIK): ${pegawai.nama} - ${pegawai.nik}`);
  } else {
    newData.push(pegawai);
    existingNiks.add(pegawai.nik);
  }
}

console.log(`\nAdding ${newData.length} new pegawai records`);
console.log('New data:');
newData.forEach(d => console.log(`  - ${d.nama} (${d.nik}) [${d.status_kepegawaian}] (${d.role})`));

// Merge and save
const mergedData = [...existingData, ...newData];
writeFileSync('src/data/data-pegawai.json', JSON.stringify(mergedData, null, 2), 'utf-8');
console.log(`\nTotal records: ${mergedData.length}`);
console.log('Done!');