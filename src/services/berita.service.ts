import { adminDb } from '@/lib/firebase-admin';

export async function getAllBerita() {
  const snapshot = await adminDb.collection('berita').orderBy('tanggal', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createBerita(data: any) {
  const ref = await adminDb.collection('berita').add(data);
  return ref.id;
}
