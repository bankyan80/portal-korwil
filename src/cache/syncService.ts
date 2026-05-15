import { getCache, setCache, compareData } from './cacheService';

type SyncCallback<T> = (data: T) => void;
type FetchFn<T> = () => Promise<T>;

interface SyncEntry<T> {
  key: string;
  fetchFn: FetchFn<T>;
  callback: SyncCallback<T>;
  interval: number;
  timer: ReturnType<typeof setInterval> | null;
}

const syncRegistry = new Map<string, SyncEntry<unknown>>();

function syncKey(collection: string, ...parts: string[]): string {
  return [collection, ...parts].join('::');
}

export function registerSync<T>(
  collection: string,
  fetchFn: FetchFn<T>,
  callback: SyncCallback<T>,
  interval = 30_000,
  ...parts: string[]
): () => void {
  const key = syncKey(collection, ...parts);

  const entry: SyncEntry<T> = {
    key,
    fetchFn,
    callback,
    interval,
    timer: null,
  };

  syncRegistry.set(key, entry);

  entry.timer = setInterval(async () => {
    try {
      const fresh = await fetchFn();
      const cached = await getCache<T>(collection, ...parts);
      const changed = cached === null || !(await compareData(cached, fresh));
      if (changed) {
        await setCache(collection, fresh, ...parts);
        callback(fresh);
      }
    } catch {}
  }, interval);

  return () => {
    if (entry.timer) clearInterval(entry.timer);
    syncRegistry.delete(key);
  };
}

export async function syncOnce<T>(
  collection: string,
  fetchFn: FetchFn<T>,
  callback: SyncCallback<T>,
  ...parts: string[]
): Promise<void> {
  try {
    const fresh = await fetchFn();
    const cached = await getCache<T>(collection, ...parts);
    const changed = cached === null || !(await compareData(cached, fresh));
    if (changed) {
      await setCache(collection, fresh, ...parts);
      callback(fresh);
    }
  } catch {}
}

export function unregisterSync(collection: string, ...parts: string[]): void {
  const key = syncKey(collection, ...parts);
  const entry = syncRegistry.get(key);
  if (entry) {
    if (entry.timer) clearInterval(entry.timer);
    syncRegistry.delete(key);
  }
}

export function clearAllSyncs(): void {
  for (const [, entry] of syncRegistry) {
    if (entry.timer) clearInterval(entry.timer);
  }
  syncRegistry.clear();
}
