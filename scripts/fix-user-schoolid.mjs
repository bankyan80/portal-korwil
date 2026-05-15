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

const app = initializeApp({ credential: cert(sa) }, 'fix-schoolId');
const db = getFirestore(app);

const uids = ['LM39IQWnXpXw2BWHXwth34raNSE3', 'R1Pv8CgSiAb4UA4UAlUbfK9Mi8h1'];
for (const uid of uids) {
  await db.collection('users').doc(uid).update({ schoolId: 'sd-negeri-1-lemahabang' });
  console.log('Updated user:', uid);
}
console.log('Done - schoolId set to sd-negeri-1-lemahabang');
process.exit(0);
