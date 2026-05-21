import { adminDb } from '@/lib/firebase-admin';
import { getCanonicalSchoolName } from '@/lib/normalize';
import fs from 'fs';
import path from 'path';

function normalizeRecord(d: any) {
  if (d.sekolah) d.sekolah = getCanonicalSchoolName(d.sekolah);
  return d;
}

function loadFromStatic() {
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  let result = raw.map((d: any, i: number) => normalizeRecord({ id: d.nik || `pegawai_${i}`, ...d }));

  const tkPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json');
  if (fs.existsSync(tkPath)) {
    const tkRaw = JSON.parse(fs.readFileSync(tkPath, 'utf-8'));
    const tkMapped = tkRaw.map((d: any, i: number) => normalizeRecord({ id: d.nik || `pegawai_tk_${i}`, ...d }));
    result = [...result, ...tkMapped];
  }

  return result;
}

function unionAll(firestoreRecords: any[], staticRecords: any[]): any[] {
  const map = new Map<string, any>();
  // Static first (base data)
  for (const r of staticRecords) {
    map.set(r.nik || r.id, { ...r, _source: 'static' });
  }
  // Firestore overrides static by NIK
  for (const r of firestoreRecords) {
    const key = r.nik || r.id;
    if (map.has(key)) {
      map.set(key, { ...map.get(key), ...r, _source: 'merged' });
    } else {
      map.set(key, { ...r, _source: 'firestore' });
    }
  }
  return [...map.values()];
}

export async function getAllPegawai() {
  if (!adminDb) return loadFromStatic();
  try {
    const snapshot = await adminDb.collection('employees').get();
    if (snapshot.empty) return loadFromStatic();
    const firestoreRecords = snapshot.docs.map(doc => normalizeRecord({ id: doc.id, ...doc.data() }));
    const staticRecords = loadFromStatic();
    return unionAll(firestoreRecords, staticRecords);
  } catch {
    return loadFromStatic();
  }
}

export async function getPegawaiByNik(nik: string) {
  if (!adminDb) {
    const all = loadFromStatic();
    return all.find((d: any) => d.nik === nik) || null;
  }
  try {
    const doc = await adminDb.collection('employees').doc(nik).get();
    if (doc.exists) return normalizeRecord({ id: doc.id, ...doc.data() });
    const all = loadFromStatic();
    return all.find((d: any) => d.nik === nik) || null;
  } catch {
    const all = loadFromStatic();
    return all.find((d: any) => d.nik === nik) || null;
  }
}
