'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface SupabaseQueryResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSupabaseQuery<T extends Record<string, unknown>>(
  table: string,
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    filters?: { column: string; value: unknown }[];
  }
): SupabaseQueryResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from(table).select('*');

      if (options?.filters) {
        for (const f of options.filters) {
          query = query.eq(f.column, f.value);
        }
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setItems((data as T[]) || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data';
      setError(msg);
      console.error(`[useSupabaseQuery] ${table}:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [table, JSON.stringify(options)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, refresh: fetchData };
}

export function useSupabaseEmployees(options?: {
  schoolName?: string;
}) {
  const filters = options?.schoolName
    ? [{ column: 'sekolah', value: options.schoolName }]
    : undefined;
  return useSupabaseQuery<Record<string, unknown>>('employees', {
    filters,
    orderBy: { column: 'nama', ascending: true },
  });
}

export function useSupabaseStudents(options?: {
  schoolName?: string;
}) {
  const filters = options?.schoolName
    ? [{ column: 'sekolah', value: options.schoolName }]
    : undefined;
  return useSupabaseQuery<Record<string, unknown>>('students', {
    filters,
    orderBy: { column: 'nama', ascending: true },
  });
}
