'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import type { Firestore } from 'firebase/firestore';

export interface FirestoreCollectionHook<T extends { id: string }> {
  items: T[];
  loading: boolean;
  error: string | null;
  addItem: (item: Omit<T, 'id'> & { id?: string }) => Promise<void>;
  updateItem: (id: string, updates: Partial<T>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  seedData: (data: T[]) => Promise<void>;
  replaceAll: (data: T[]) => Promise<void>;
}

export function useFirestoreCollection<T extends { id: string }>(
  collectionPath: string,
  _defaultData: T[] = [],
  orderField?: keyof T
): FirestoreCollectionHook<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (firestore: Firestore): Promise<T[]> => {
    try {
      let q;
      if (orderField) {
        q = query(collection(firestore, collectionPath), orderBy(orderField as string));
      } else {
        q = query(collection(firestore, collectionPath));
      }

      const snapshot = await getDocs(q);
      const fetchedItems: T[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        fetchedItems.push({
          id: docSnap.id,
          ...data,
        } as T);
      });

      return fetchedItems;
    } catch (err) {
      console.error(`Error fetching ${collectionPath}:`, err);
      throw err;
    }
  }, [collectionPath, orderField]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!db) {
      setItems([]);
      setLoading(false);
      return;
    }

    const firestore = db;

    try {
      const fetched = await fetchItems(firestore);
      setItems(fetched);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error(`Error in refresh ${collectionPath}:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchItems]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const seedData = useCallback(async (data: T[]) => {
    if (!db) return;
    const firestore = db;

    try {
      const batch = writeBatch(firestore);

      data.forEach((item) => {
        const docRef = doc(firestore, collectionPath, item.id);
        const itemData = { ...item } as Record<string, unknown>;
        delete itemData.id;
        batch.set(docRef, itemData);
      });

      await batch.commit();
      console.log(`Seeded ${data.length} items to ${collectionPath}`);

      await refresh();
      toast.success(`Data berhasil disimpan ke ${collectionPath}`);
    } catch (err) {
      console.error(`Error seeding ${collectionPath}:`, err);
      toast.error('Gagal menyimpan data');
    }
  }, [collectionPath, refresh]);

  const replaceAll = useCallback(async (data: T[]) => {
    if (!db) {
      setItems([...data]);
      return;
    }

    const firestore = db;

    try {
      const existing = await fetchItems(firestore);

      const batch = writeBatch(firestore);
      existing.forEach((item) => {
        batch.delete(doc(firestore, collectionPath, item.id));
      });
      data.forEach((item) => {
        const docRef = doc(firestore, collectionPath, item.id);
        const itemData = { ...item } as Record<string, unknown>;
        delete itemData.id;
        batch.set(docRef, itemData);
      });
      await batch.commit();

      setItems([...data]);
    } catch (err) {
      console.error(`Error replacing ${collectionPath}:`, err);
      toast.error('Gagal menyimpan data');
    }
  }, [collectionPath, fetchItems]);

  const addItem = useCallback(async (item: Omit<T, 'id'> & { id?: string }) => {
    const newId = item.id || `${collectionPath}-${Date.now()}`;

    if (!db) {
      setItems((prev) => [{ ...item, id: newId } as T, ...prev]);
      return;
    }

    const firestore = db;

    try {
      const docRef = doc(firestore, collectionPath, newId);
      const itemData = { ...item } as Record<string, unknown>;
      delete itemData.id;
      await setDoc(docRef, itemData);

      const newItem = { ...item, id: newId } as T;
      setItems((prev) => [newItem, ...prev]);
      toast.success('Item berhasil ditambahkan');
    } catch (err) {
      console.error(`Error adding item to ${collectionPath}:`, err);
      toast.error('Gagal menambahkan item');
      throw err;
    }
  }, [collectionPath]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    if (!db) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      return;
    }

    const firestore = db;

    try {
      const docRef = doc(firestore, collectionPath, id);
      const updatesData = { ...updates } as Record<string, unknown>;
      delete updatesData.id;
      await setDoc(docRef, updatesData, { merge: true });

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      toast.success('Item berhasil diperbarui');
    } catch (err) {
      console.error(`Error updating item in ${collectionPath}:`, err);
      toast.error('Gagal memperbarui item');
      throw err;
    }
  }, [collectionPath]);

  const deleteItem = useCallback(async (id: string) => {
    if (!db) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    const firestore = db;

    try {
      const docRef = doc(firestore, collectionPath, id);
      await deleteDoc(docRef);

      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Item berhasil dihapus');
    } catch (err) {
      console.error(`Error deleting item from ${collectionPath}:`, err);
      toast.error('Gagal menghapus item');
      throw err;
    }
  }, [collectionPath]);

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refresh,
    seedData,
    replaceAll,
  };
}
