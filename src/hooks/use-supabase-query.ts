'use client';

import { useState, useEffect, useRef } from 'react';
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

  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; }, [options]);

  useEffect(() => {
    const currentOptions = optionsRef.current;

    async function fetchData() {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        let query = supabase.from(table).select('*');

        if (currentOptions?.filters) {
          for (const f of currentOptions.filters) {
            query = query.eq(f.column, f.value);
          }
        }

        if (currentOptions?.orderBy) {
          query = query.order(currentOptions.orderBy.column, {
            ascending: currentOptions.orderBy.ascending ?? true,
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
    }

    fetchData();
  }, [table]);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from(table).select('*');
      const currentOptions = optionsRef.current;

      if (currentOptions?.filters) {
        for (const f of currentOptions.filters) {
          query = query.eq(f.column, f.value);
        }
      }

      if (currentOptions?.orderBy) {
        query = query.order(currentOptions.orderBy.column, {
          ascending: currentOptions.orderBy.ascending ?? true,
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
  };

  return { items, loading, error, refresh };
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
