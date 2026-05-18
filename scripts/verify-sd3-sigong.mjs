import { cert, initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const saFile = readFileSync(join(__dirname, '..', 'service-account', 'kedinasan-e5317-firebase-adminsdk-fbsvc-79852a38b0.json'), 'utf-8');
const sa = JSON.parse(saFile);

const app = getApps().length === 0 ? initializeApp({ credential: cert(sa) }) : getApp();
const db = getFirestore(app);

const snap = await db.collection('employees').where('sekolah', '==', 'SD NEGERI 3 SIGONG').get();
console.log('Total SD NEGERI 3 SIGONG:', snap.size);
snap.docs.forEach(d => {
  const s = d.data();
  console.log(` - ${s.nama} | ${s.jabatan} | ${s.jenisKelamin} | NIK: ${s.nik || '-'} | NIP: ${s.nip || '-'}`);
});
