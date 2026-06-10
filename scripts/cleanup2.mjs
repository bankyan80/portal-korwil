const FIREBASE_API = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4';
const API = 'https://www.portalkorwil.online/api/firestore';

async function getToken() {
  const r = await fetch(FIREBASE_API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'yanuarhidayat80@gmail.com', password: 'Admin123!', returnSecureToken: true }),
  });
  return (await r.json()).idToken;
}

async function getAll(collection, token) {
  const all = [];
  for (let offset = 0; ; offset += 1000) {
    const r = await fetch(`${API}/${collection}?limit=1000&offset=${offset}&orderBy=id`, {
      headers: { Cookie: `auth-token=${token}` },
    });
    const data = await r.json();
    if (!data.items?.length) break;
    all.push(...data.items);
    if (data.items.length < 1000) break;
  }
  return all;
}

async function batchDelete(collection, ids, token) {
  const CONCURRENT = 50;
  let ok = 0, fail = 0;
  for (let i = 0; i < ids.length; i += CONCURRENT) {
    const batch = ids.slice(i, i + CONCURRENT);
    const results = await Promise.allSettled(
      batch.map(id =>
        fetch(`${API}/${collection}?id=${encodeURIComponent(id)}`, {
          method: 'DELETE', headers: { Cookie: `auth-token=${token}` },
        }).then(r => r.ok)
      )
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) ok++;
      else fail++;
    }
    process.stdout.write(`\r  ${i + batch.length}/${ids.length} (ok:${ok} fail:${fail})`);
  }
  return { ok, fail };
}

async function main() {
  const token = await getToken();
  console.log('Token ok');

  console.log('\nFetching all students...');
  const students = await getAll('students', token);
  console.log(`Total: ${students.length}`);

  const uuidPattern = /^[0-9a-f-]{36}$/;

  // Pass 1: Delete orphan UUID records (no NISN, no NIK)
  const orphans = students.filter(s => uuidPattern.test(s.id) && !s.nisn && !s.nik);
  if (orphans.length > 0) {
    console.log(`\nOrphan UUID records (no NISN/NIK): ${orphans.length}`);
    const r = await batchDelete('students', orphans.map(s => s.id), token);
    console.log(`  Deleted: ${r.ok}`);
  }

  // Pass 2: Dedup by NISN — keep NISN-based record, delete UUID duplicate
  const groups = new Map();
  for (const s of students) {
    const key = s.nisn || '';
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  const toDelete = [];
  for (const [key, records] of groups) {
    if (records.length <= 1) continue;
    const preferred = records.find(r => r.id === key) || records.find(r => !uuidPattern.test(r.id)) || records[0];
    for (const r of records) {
      if (r !== preferred) toDelete.push(r.id);
    }
  }

  if (toDelete.length > 0) {
    console.log(`\nNISN dedup: ${toDelete.length} to delete...`);
    const r = await batchDelete('students', toDelete, token);
    console.log(`  Deleted: ${r.ok}`);
  }

  // Final count
  const final = await getAll('students', token);
  console.log(`\n=== Final: ${final.length} students ===`);
}

main().catch(e => console.error('FATAL:', e));
