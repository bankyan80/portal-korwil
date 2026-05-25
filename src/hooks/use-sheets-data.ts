'use client';

import { useState, useEffect, useCallback } from 'react';

type SheetType = 'pegawai' | 'siswa' | 'sekolah';

interface SheetsResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (data: Record<string, string>) => Promise<boolean>;
  update: (rowIndex: number, data: Record<string, string>) => Promise<boolean>;
  remove: (rowIndex: number) => Promise<boolean>;
}

export function useSheetsData<T extends Record<string, string>>(
  type: SheetType
): SheetsResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/sheets/${type}`;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(base);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      } else {
        throw new Error(json.error);
      }
    } catch (err: any) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (data: Record<string, string>) => {
    try {
      const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.success) { await refresh(); return true; }
      throw new Error(json.error);
    } catch { return false; }
  }, [base, refresh]);

  const update = useCallback(async (rowIndex: number, data: Record<string, string>) => {
    try {
      const res = await fetch(base, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rowIndex, ...data }) });
      const json = await res.json();
      if (json.success) { await refresh(); return true; }
      throw new Error(json.error);
    } catch { return false; }
  }, [base, refresh]);

  const remove = useCallback(async (rowIndex: number) => {
    try {
      const res = await fetch(base, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rowIndex }) });
      const json = await res.json();
      if (json.success) { await refresh(); return true; }
      throw new Error(json.error);
    } catch { return false; }
  }, [base, refresh]);

  return { items, loading, error, refresh, add, update, remove };
}
