const FIREBASE_API = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBnILMRQYvxTneBoXPilKPrmz7qknNRl_4';
const API = 'https://www.portalkorwil.online/api/firestore';

async function getToken() {
  const r = await fetch(FIREBASE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'yanuarhidayat80@gmail.com', password: 'Admin123!', returnSecureToken: true }),
  });
  return (await r.json()).idToken;
}

async function getAll(collection, token, batchSize = 1000) {
  const allItems = [];
  let offset = 0;
  while (true) {
    const r = await fetch(`${API}/${collection}?limit=${batchSize}&offset=${offset}&orderBy=id`, {
      headers: { Cookie: `auth-token=${token}` },
    });
    const data = await r.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    if (!data.items || data.items.length === 0) break;
    allItems.push(...data.items);
    if (data.items.length < batchSize) break;
    offset += batchSize;
  }
  return allItems;
}

async function deleteRecord(collection, id, token) {
  const r = await fetch(`${API}/${collection}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Cookie: `auth-token=${token}` },
  });
  return r.ok;
}

async function dedupe(collection, idField, token) {
  const items = await getAll(collection, token);
  console.log(`\n${collection}: ${items.length} total records`);

  // Items from API are flattened: { id, nik, nama, ... }
  const groups = new Map();
  for (const item of items) {
    const key = item[idField] || '';
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  let deleted = 0;
  for (const [key, records] of groups) {
    if (records.length <= 1) continue;
    const preferred = records.find(r => r.id === key);
    for (const r of records) {
      if (r !== preferred) {
        if (await deleteRecord(collection, r.id, token)) deleted++;
        else process.stderr.write(`FAIL del ${r.id}\n`);
      }
    }
  }
  console.log(`  Deleted ${deleted} duplicates (by ${idField})`);

  // Delete old records with UUID-style IDs (if no matching key field)
  const uuidPattern = /^[0-9a-f-]{36}$/;
  let uuidDeleted = 0;
  for (const item of items) {
    if (uuidPattern.test(item.id) && !item[idField] && !item.nik && !item.nisn) {
      if (await deleteRecord(collection, item.id, token)) uuidDeleted++;
    }
  }
  console.log(`  Deleted ${uuidDeleted} UUID-based records`);
}

async function main() {
  const token = await getToken();
  console.log('Token ok');

  await dedupe('employees', 'nik', token);
  await dedupe('students', 'nisn', token);

  // Final count
  for (const col of ['employees', 'students', 'schools']) {
    const items = await getAll(col, token);
    console.log(`\n=== ${col}: ${items.length} remaining ===`);
  }
}

main().catch(e => console.error('FATAL:', e));
