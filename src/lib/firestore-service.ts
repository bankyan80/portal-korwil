import { db } from './firebase';
import {
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch, query, orderBy,
} from 'firebase/firestore';

export async function fetchCollection<T extends { id: string }>(
  collectionPath: string,
  orderField?: string
): Promise<T[]> {
  if (!db) return [];
  let q = orderField
    ? query(collection(db, collectionPath), orderBy(orderField))
    : query(collection(db, collectionPath));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
}

export async function addItemToCollection<T extends { id: string }>(
  collectionPath: string,
  item: Omit<T, 'id'> & { id?: string },
  generateId?: () => string
): Promise<T> {
  const newId = item.id || (generateId ? generateId() : `${collectionPath}-${Date.now()}`);
  if (db) {
    const docRef = doc(db, collectionPath, newId);
    const { id: _, ...data } = item as any;
    await setDoc(docRef, { ...data, createdAt: Date.now(), updatedAt: Date.now() });
  }
  return { ...item, id: newId } as T;
}

export async function updateItemInCollection(
  collectionPath: string,
  id: string,
  updates: Record<string, unknown>
): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, collectionPath, id), { ...updates, updatedAt: Date.now() }, { merge: true });
}

export async function deleteItemFromCollection(
  collectionPath: string,
  id: string
): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, collectionPath, id));
}

export async function replaceAllInCollection<T extends { id: string }>(
  collectionPath: string,
  data: T[]
): Promise<void> {
  if (!db) return;
  const existing = await fetchCollection<T>(collectionPath);
  const batch = writeBatch(db);
  existing.forEach(item => batch.delete(doc(db, collectionPath, item.id)));
  data.forEach(item => {
    const { id, ...rest } = item;
    batch.set(doc(db, collectionPath, id), rest);
  });
  await batch.commit();
}
