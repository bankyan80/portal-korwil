'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllQueued, processQueue, dequeue, queueCount } from '@/lib/local/offlineQueue';
import type { QueuedOperation } from '@/lib/local/offlineQueue';

export function useOfflineQueue() {
  const [count, setCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [operations, setOperations] = useState<QueuedOperation[]>([]);

  const refresh = useCallback(async () => {
    const c = await queueCount();
    setCount(c);
    if (c > 0) {
      setOperations(await getAllQueued());
    } else {
      setOperations([]);
    }
  }, []);

  const processAll = useCallback(async () => {
    setProcessing(true);
    const result = await processQueue();
    await refresh();
    setProcessing(false);
    return result;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await dequeue(id);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { count, processing, operations, processAll, remove, refresh };
}
