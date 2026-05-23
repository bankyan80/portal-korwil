'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { collection, getDocs, onSnapshot, query, type QueryConstraint, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { setCache, getCache } from '@/cache/cacheService';

interface UseCachedFirestoreOptions {
  collectionName: string;
  constraints?: QueryConstraint[];
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
    constraints = [],
    cacheKey,
    realtime = false,
    enabled = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const mountedRef = useRef(true);

  // Stable cache key string — avoids array identity issues
  const cacheKeyStr = cacheKey ?? collectionName;

  const constraintsKey = JSON.stringify(constraints);

  const fetchData = useCallback(async (): Promise<T[]> => {
    if (!db) return [];
    const q = query(collection(db, collectionName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintsKey]);

  const loadFromCacheThenRefresh = useCallback(async () => {
    if (!enabled || !db) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      const cached = await getCache<T[]>(collectionName, cacheKeyStr);
      if (cached && mountedRef.current) {
        setData(cached);
        setLoading(false);
        if (cached.length > 0) return;
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

    if (realtime && db) {
      try {
        const q = query(collection(db, collectionName), ...constraints);
        const unsub = onSnapshot(q, (snap) => {
          if (!mountedRef.current) return;
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
          setData(docs);
          setCache(collectionName, docs, cacheKeyStr);
        }, (err) => {
          if (mountedRef.current) setError(err.message);
        });
        unsubscribeRef.current = unsub;
      } catch {}
    }

    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintsKey, realtime, enabled, cacheKeyStr]);

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
