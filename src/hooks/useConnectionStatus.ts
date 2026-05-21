'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, query, limit, getDocs,
} from 'firebase/firestore';
import { enqueue } from '@/lib/local/offlineQueue';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'offline_browser';

export function useConnectionStatus(): {
  status: ConnectionStatus;
  lastSync: number | null;
  browserOnline: boolean;
  probe: () => Promise<void>;
} {
  const [browserOnline, setBrowserOnline] = useState(true);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const probe = useCallback(async () => {
    if (!browserOnline) {
      setStatus('offline_browser');
      return;
    }
    if (!db) {
      setStatus('connecting');
      return;
    }
    try {
      await getDocs(query(collection(db, 'menus'), limit(1)));
      if (mountedRef.current) {
        setStatus('connected');
        setLastSync(Date.now());
      }
    } catch {
      if (mountedRef.current) setStatus('disconnected');
    }
  }, [browserOnline]);

  useEffect(() => {
    mountedRef.current = true;
    const onOnline = () => { setBrowserOnline(true); };
    const onOffline = () => { setBrowserOnline(false); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    probe();
    const interval = setInterval(probe, 30_000);
    const onReconnect = () => {
      setStatus('connecting');
      setTimeout(probe, 1000);
    };
    window.addEventListener('online', onReconnect);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onReconnect);
    };
  }, [probe]);

  useEffect(() => {
    const handle = setInterval(async () => {
      if (status === 'connected' && browserOnline) {
        try {
          const count = await (await import('@/lib/local/offlineQueue')).queueCount();
          if (count > 0) {
            await (await import('@/lib/local/offlineQueue')).processQueue();
          }
        } catch {}
      }
    }, 10_000);
    return () => clearInterval(handle);
  }, [status, browserOnline]);

  return { status, lastSync, browserOnline, probe };
}
