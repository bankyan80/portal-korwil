import { adminDb } from '@/lib/firebase-admin';
import fs from 'fs';
import path from 'path';

function loadFromStatic() {
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  let result = raw.map((d: any, i: number) => ({ id: d.nik || `pegawai_${i}`, ...d }));

  // Merge TK/KB pegawai data if available
  const tkPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json');
  if (fs.existsSync(tkPath)) {
    const tkRaw = JSON.parse(fs.readFileSync(tkPath, 'utf-8'));
    const tkMapped = tkRaw.map((d: any, i: number) => ({ id: d.nik || `pegawai_tk_${i}`, ...d }));
    result = [...result, ...tkMapped];
  }

  return result;
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
