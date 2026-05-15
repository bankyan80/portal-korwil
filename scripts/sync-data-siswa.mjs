import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const NEW_DATA_PATH = join('C:', 'Users', 'Bank Yan', 'Downloads', 'data_sekolah', 'data_siswa', 'data_siswa.json');
const OLD_DATA_PATH = join(root, 'src', 'data', 'data-siswa.json');

const newRaw = readFileSync(NEW_DATA_PATH, 'utf-8');
const newData = JSON.parse(newRaw);

let oldData = [];
try {
  const oldRaw = readFileSync(OLD_DATA_PATH, 'utf-8');
  oldData = JSON.parse(oldRaw);
} catch { }

const oldLayakPip = new Map();
for (const s of oldData) {
  if (s.nik && s.layak_pip) {
    oldLayakPip.set(s.nik, s.layak_pip);
  }
}

const merged = newData.map(s => ({
  ...s,
  layak_pip: oldLayakPip.get(s.nik) || 'Tidak',
}));

merged.sort((a, b) => a.sekolah.localeCompare(b.sekolah) || a.nama.localeCompare(b.nama));

writeFileSync(OLD_DATA_PATH, JSON.stringify(merged, null, 2), 'utf-8');

const totalPipYa = merged.filter(s => s.layak_pip === 'Ya').length;
console.log(`Sync selesai. Total siswa: ${merged.length}`);
console.log(`  Layak PIP Ya: ${totalPipYa}`);
console.log(`  Layak PIP Tidak: ${merged.length - totalPipYa}`);
console.log(`  File: ${OLD_DATA_PATH}`);
