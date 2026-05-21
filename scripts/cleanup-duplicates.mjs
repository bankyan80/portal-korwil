import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4',
  authDomain: 'kedinasan-e5317.firebaseapp.com',
  projectId: 'kedinasan-e5317',
  storageBucket: 'kedinasan-e5317.firebasestorage.app',
});
const db = getFirestore(app);

// Get all school IDs
const schoolIds = new Set();
(await getDocs(collection(db, 'schools'))).forEach(d => schoolIds.add(d.id));
console.log('School IDs:', schoolIds.size);

async function clean(name) {
  const snap = await getDocs(collection(db, name));
  const toDelete = [];
  snap.forEach(d => {
    const data = d.data();
    if (!data.sekolah && data.schoolId && schoolIds.has(data.schoolId)) {
      toDelete.push(d.id);
    }
  });
  console.log(`${name}: ${toDelete.length} duplicates`);
  while (toDelete.length) {
    const b = writeBatch(db);
    const chunk = toDelete.splice(0, 500);
    chunk.forEach(id => b.delete(doc(db, name, id)));
    await b.commit();
    console.log(`  deleted ${chunk.length}`);
  }
}

await clean('students');
await clean('employees');

// Final counts
for (const coll of ['employees', 'students']) {
  const snap = await getDocs(collection(db, coll));
  const counts = {};
  snap.forEach(d => {
    const k = d.data().sekolah || d.data().schoolId || '?';
    counts[k] = (counts[k] || 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\n${coll}: ${total} total`);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  entries.filter((_, i) => i < 30 || entries.length - i <= 5).forEach(([k, v]) =>
    console.log(`  ${String(v).padStart(5)} ${k}`)
  );
}
process.exit(0);
