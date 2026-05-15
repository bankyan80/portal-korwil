import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const saDir = join(root, 'service-account');
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

const app = initializeApp({ credential: cert(sa) }, 'check-user');
const db = getFirestore(app);

async function main() {
  const snap = await db.collection('users').get();
  snap.forEach(d => {
    const u = d.data();
    if (u.schoolName === 'SD NEGERI 1 LEMAHABANG') {
      console.log('User ditemukan:');
      console.log('  uid:', d.id);
      console.log('  email:', u.email);
      console.log('  schoolId:', u.schoolId);
      console.log('  schoolName:', u.schoolName);
      console.log('  role:', u.role);
    }
  });

  const expectedId = 'sd-negeri-1-lemahabang';
  console.log('\nExpected school doc ID:', expectedId);
  const schoolDoc = await db.collection('schools').doc(expectedId).get();
  console.log('School doc exists:', schoolDoc.exists);
  if (schoolDoc.exists) {
    console.log('School data:', JSON.stringify(schoolDoc.data(), null, 2));
  }
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
