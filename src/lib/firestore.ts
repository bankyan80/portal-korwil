import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, Timestamp, serverTimestamp, onSnapshot,
  type Firestore,
} from 'firebase/firestore';

export function getCollection(name: string) {
  if (!db) return null;
  return collection(db, name);
}

export async function getAllDocs(collectionName: string) {
  if (!db) return [];
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getDocById(collectionName: string, id: string) {
  if (!db) return null;
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function addDocument(collectionName: string, data: Record<string, unknown>) {
  if (!db) return null;
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function updateDocument(collectionName: string, id: string, data: Record<string, unknown>) {
  if (!db) return;
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteDocument(collectionName: string, id: string) {
  if (!db) return;
  await deleteDoc(doc(db, collectionName, id));
}

export async function getDocumentsByField(
  collectionName: string,
  field: string,
  value: string
) {
  if (!db) return [];
  const q = query(collection(db, collectionName), where(field, '==', value));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function listenToCollection(
  collectionName: string,
  callback: (data: any[]) => void,
  onError?: (err: Error) => void
) {
  if (!db) {
    callback([]);
    return () => {};
  }
  return onSnapshot(collection(db, collectionName), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, onError);
}
