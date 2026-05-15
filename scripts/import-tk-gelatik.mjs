import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const saPath = join(__dirname, '..', 'service-account');
const files = readFileSync(join(saPath, 'kedinasan-e5317-firebase-adminsdk-fbsvc-79852a38b0.json'), 'utf-8');
const serviceAccount = JSON.parse(files);

const app = !getApps().length
  ? initializeApp({ credential: cert(serviceAccount) })
  : getApps()[0];
const db = getFirestore(app);

const dataPath = join(__dirname, '..', 'src', 'data', 'tk-gelatik-pegawai.json');
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

async function main() {
  let added = 0;
  for (const record of data) {
    try {
      await db.collection('employees').add({
        ...record,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`ADDED: ${record.nama} (${record.nik}) - ${record.jenis_ptk} @ ${record.sekolah}`);
      added++;
    } catch (e) {
      console.error(`FAILED: ${record.nama} (${record.nik}): ${e.message}`);
    }
  }
  console.log(`\nDone. Added: ${added}/${data.length}`);
}

main().catch(console.error);
