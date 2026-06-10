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

async function getAll(collection, token) {
  const all = [];
  const BATCH = 1000;
  let offset = 0;
  while (true) {
    const r = await fetch(`${API}/${collection}?limit=${BATCH}&offset=${offset}&orderBy=id`, {
      headers: { Cookie: `auth-token=${token}` },
    });
    const data = await r.json();
    if (!data.items || data.items.length === 0) break;
    all.push(...data.items);
    if (data.items.length < BATCH) break;
    offset += BATCH;
  }
  return all;
}

async function main() {
  const token = await getToken();
  console.log('Token ok');

  const students = await getAll('students', token);
  console.log(`Students total: ${students.length}`);

  // Group by nisn
  const groups = new Map();
  for (const s of students) {
    const key = s.nisn || s.nik || '';
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  let deleted = 0;
  let skipped = 0;

  // First pass: dedup by nisn
  for (const [key, records] of groups) {
    if (records.length <= 1) continue;
    // Prefer record where id === key (nisn), then any non-UUID ID
    const preferred = records.find(r => r.id === key) || records.find(r => !/^[0-9a-f-]{36}$/.test(r.id));
    const toDelete = records.filter(r => r !== preferred);
    for (const r of toDelete) {
      const resp = await fetch(`${API}/students?id=${encodeURIComponent(r.id)}`, {
        method: 'DELETE',
        headers: { Cookie: `auth-token=${token}` },
      });
      if (resp.ok) deleted++;
      else skipped++;
      process.stdout.write(`\rDedup by NISN - Deleted: ${deleted}, Skipped: ${skipped}`);
    }
  }
  console.log(`\nPass 1 - Dedup by NISN: Deleted ${deleted}, Skipped ${skipped}`);

  // Second pass: delete UUID-style records with no nisn/nik
  let uuidDeleted = 0;
  for (const s of students.filter(s => !s.nisn && !s.nik && /^[0-9a-f-]{36}$/.test(s.id))) {
    const resp = await fetch(`${API}/students?id=${encodeURIComponent(s.id)}`, {
      method: 'DELETE',
      headers: { Cookie: `auth-token=${token}` },
    });
    if (resp.ok) uuidDeleted++;
    process.stdout.write(`\rUUID records deleted: ${uuidDeleted}`);
  }
  console.log(`\nPass 2 - UUID records with no NISN: Deleted ${uuidDeleted}`);

  deleted += uuidDeleted;

  // Final count
  const final = await getAll('students', token);
  console.log(`Final student count: ${final.length}`);
}

main().catch(e => console.error('FATAL:', e));
