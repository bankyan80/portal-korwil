import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const saDir = join(root, 'service-account');
const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
const sa = JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));

const app = initializeApp({ credential: cert(sa) }, 'set-kepsek');
const db = getFirestore(app);

await db.collection('schools').doc('sd-negeri-1-lemahabang').update({
  kepalaSekolah: 'Mulus, S.Pd',
});
console.log('Updated kepalaSekolah for sd-negeri-1-lemahabang');
process.exit(0);
