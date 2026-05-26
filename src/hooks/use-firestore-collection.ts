'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiSet, apiDelete } from '@/lib/api-firestore';
import { toast } from 'sonner';

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

function sortData<T extends { id: string }>(data: T[], orderField?: keyof T): T[] {
  if (!orderField) return data;
  return [...data].sort((a, b) => {
    const aVal = a[orderField];
    const bVal = b[orderField];
    if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal);
    return String(aVal ?? '').localeCompare(String(bVal ?? ''));
  });
}

export function useFirestoreCollection<T extends { id: string }>(
  collectionPath: string,
  _defaultData: T[] = [],
  orderField?: keyof T
): FirestoreCollectionHook<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet(collectionPath, orderField ? { orderBy: { field: orderField as string } } : undefined);
      setItems(sortData(result.items || [], orderField));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error(`Error in refresh ${collectionPath}:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [collectionPath, orderField]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const seedData = useCallback(async (data: T[]) => {
    try {
      for (const item of data) {
        const { id, ...rest } = item;
        await apiSet(collectionPath, id, rest as Record<string, unknown>, false);
      }
      await refresh();
      toast.success(`Data berhasil disimpan ke ${collectionPath}`);
    } catch (err) {
      console.error(`Error seeding ${collectionPath}:`, err);
      toast.error('Gagal menyimpan data');
    }
  }, [collectionPath, refresh]);

  const replaceAll = useCallback(async (data: T[]) => {
    try {
      const existing = await apiGet(collectionPath);
      for (const item of existing.items || []) {
        await apiDelete(collectionPath, item.id);
      }
      for (const item of data) {
        const { id, ...rest } = item;
        await apiSet(collectionPath, id, rest as Record<string, unknown>, false);
      }
      setItems(sortData([...data], orderField));
    } catch (err) {
      console.error(`Error replacing ${collectionPath}:`, err);
      toast.error('Gagal menyimpan data');
    }
  }, [collectionPath, orderField]);

  const addItem = useCallback(async (item: Omit<T, 'id'> & { id?: string }) => {
    const newId = item.id || `${collectionPath}-${Date.now()}`;
    try {
      await apiSet(collectionPath, newId, item as Record<string, unknown>, false);
      const newItem = { ...item, id: newId } as T;
      setItems((prev) => sortData([newItem, ...prev], orderField));
      toast.success('Item berhasil ditambahkan');
    } catch (err) {
      console.error(`Error adding item to ${collectionPath}:`, err);
      toast.error('Gagal menambahkan item');
      throw err;
    }
  }, [collectionPath, orderField]);

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      await apiSet(collectionPath, id, updates as Record<string, unknown>, true);
      setItems((prev) =>
        sortData(prev.map((item) => (item.id === id ? { ...item, ...updates } : item)), orderField)
      );
      toast.success('Item berhasil diperbarui');
    } catch (err) {
      console.error(`Error updating item in ${collectionPath}:`, err);
      toast.error('Gagal memperbarui item');
      throw err;
    }
  }, [collectionPath, orderField]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await apiDelete(collectionPath, id);
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
