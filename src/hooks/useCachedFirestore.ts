'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { setCache, getCache } from '@/cache/cacheService';

interface UseCachedFirestoreOptions {
  collectionName: string;
  constraints?: never[];
  cacheKey?: string;
  realtime?: boolean;
  ttl?: number;
  enabled?: boolean;
}

interface UseCachedFirestoreResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  count: number;
}

export function useCachedFirestore<T extends { id?: string }>(
  options: UseCachedFirestoreOptions
): UseCachedFirestoreResult<T> {
  const {
    collectionName,
    cacheKey,
    enabled = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cacheKeyStr = cacheKey ?? collectionName;

  const fetchData = useCallback(async (): Promise<T[]> => {
    try {
      const res = await fetch(`/api/firestore/${collectionName}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      return json.items || [];
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
      throw err;
    }
  }, [collectionName]);

  const loadFromCacheThenRefresh = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      const cached = await getCache<T[]>(collectionName, cacheKeyStr);

      if (cached && mountedRef.current) {
        setData(cached);
        setLoading(false);
        if (cached.length > 0) {
          console.log(`[Cache] Using cached data for ${collectionName}`);
          return;
        }
      }

      const fresh = await fetchData();
      if (!mountedRef.current) return;

      await setCache(collectionName, fresh, cacheKeyStr);
      setData(fresh);
      setError(null);
    } catch (e) {
      if (!mountedRef.current) return;
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [collectionName, cacheKeyStr, fetchData, enabled]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      queueMicrotask(() => {
        if (mountedRef.current) loadFromCacheThenRefresh();
      });
    }

    if (enabled) {
      intervalRef.current = setInterval(async () => {
        if (!mountedRef.current) return;
        try {
          const fresh = await fetchData();
          if (!mountedRef.current) return;
          setData(fresh);
          await setCache(collectionName, fresh, cacheKeyStr);
        } catch {}
      }, 30_000);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [collectionName, cacheKeyStr, enabled, fetchData, loadFromCacheThenRefresh]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await fetchData();
      if (!mountedRef.current) return;
      await setCache(collectionName, fresh, cacheKeyStr);
      setData(fresh);
      setError(null);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [fetchData, cacheKeyStr]);

  return { data, loading, error, refreshing, refresh, count: data.length };
}
