import { adminDb } from '@/lib/firebase-admin';

export async function getAllPegawai() {
  const snapshot = await adminDb.collection('pegawai').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getPegawaiByNik(nik: string) {
  const doc = await adminDb.collection('pegawai').doc(nik).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}
