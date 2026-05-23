#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';

const root = join(new URL('.', import.meta.url).pathname, '..', '..');

function extractSchoolNames(tsText) {
  const names = [];
  const re = /\{[^}]*?nama:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(tsText)) !== null) {
    names.push(m[1].trim());
  }
  return [...new Set(names)];
}

try {
  const sekolahTs = readFileSync(join(process.cwd(), 'src', 'data', 'sekolah.ts'), 'utf-8');
  const sekolahList = extractSchoolNames(sekolahTs);

  const siswaRaw = readFileSync(join(process.cwd(), 'src', 'data', 'data-siswa.json'), 'utf-8');
  const siswa = JSON.parse(siswaRaw);

  const siswaCounts = new Map();
  for (const s of siswa) {
    const key = (s.sekolah || '').trim();
    if (!key) continue;
    siswaCounts.set(key, (siswaCounts.get(key) || 0) + 1);
  }

  const pegawaiFiles = ['src/data/data-pegawai.json', 'src/data/data-pegawai-tk.json'];
  const pegawaiCounts = new Map();

  for (const relativePath of pegawaiFiles) {
    const filePath = join(process.cwd(), relativePath);
    try {
      const raw = readFileSync(filePath, 'utf-8');
      const pegawai = JSON.parse(raw);
      for (const p of pegawai) {
        const key = (p.sekolah || '').trim();
        if (!key) continue;
        pegawaiCounts.set(key, (pegawaiCounts.get(key) || 0) + 1);
      }
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
  }

  const noSiswa = sekolahList.filter(name => (siswaCounts.get(name) || 0) === 0);
  const noPegawai = sekolahList.filter(name => (pegawaiCounts.get(name) || 0) === 0);
  const noBoth = sekolahList.filter(name => (siswaCounts.get(name) || 0) === 0 && (pegawaiCounts.get(name) || 0) === 0);

  console.log(`Total sekolah known: ${sekolahList.length}`);
  console.log(`Sekolah tanpa siswa (${noSiswa.length}):`);
  for (const e of noSiswa) console.log(`- ${e}`);
  console.log(`\nSekolah tanpa pegawai (${noPegawai.length}):`);
  for (const e of noPegawai) console.log(`- ${e}`);
  console.log(`\nSekolah tanpa siswa dan tanpa pegawai (${noBoth.length}):`);
  for (const e of noBoth) console.log(`- ${e}`);
  process.exit(0);
} catch (err) {
  console.error('Error:', err.message || err);
  process.exit(1);
}
