import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const saDir = join(root, 'service-account');
if (!existsSync(saDir)) process.exit(1);
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
if (files.length === 0) process.exit(1);
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

const app = initializeApp({ credential: cert(sa) });
const db = getFirestore(app);

async function deleteNik(nik) {
  const docRef = db.collection('employees').doc(nik);
  const doc = await docRef.get();
  if (!doc.exists) {
    console.log(`NIK ${nik} tidak ditemukan di Firestore`);
    return false;
  }
  await docRef.delete();
  console.log(`NIK ${nik} berhasil dihapus dari Firestore`);
  return true;
}

async function main() {
  const nik = '32091704064367';
  console.log(`Menghapus NIK ${nik} dari Firestore...`);
  const success = await deleteNik(nik);
  if (success) {
    console.log('\nSelesai. Sekarang jalankan compare-pegawai.mjs lagi untuk verifikasi.');
  }
  process.exit(0);
}

main().catch(err => {
  console.error('Gagal:', err);
  process.exit(1);
});