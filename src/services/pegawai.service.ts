import { adminDb } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

function loadFromStatic() {
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  return raw.map((d: any, i: number) => ({ id: d.nik || `pegawai_${i}`, ...d }));
}

export async function getAllPegawai() {
  if (!adminDb) return loadFromStatic();
  try {
    const snapshot = await adminDb.collection('employees').get();
    if (snapshot.empty) return loadFromStatic();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch {
    return null;
  }
}
