import localforage from 'localforage';
import { CACHE_VERSION, CACHE_PREFIX, CACHE_KEY_SEPARATOR, COLLECTION_CACHE_CONFIG } from './cacheConfig';

localforage.config({
  name: 'PortalDinas',
  version: CACHE_VERSION,
  storeName: 'firebase_cache',
  description: 'Firebase Firestore offline cache for Portal Dinas',
});

interface CacheEntry<T = unknown> {
  data: T;
  version: number;
  cachedAt: number;
  expiresAt: number;
  etag?: string;
}

function cacheKey(collection: string, ...parts: string[]): string {
  return [CACHE_PREFIX, collection, ...parts].join(CACHE_KEY_SEPARATOR);
}

function getTTL(collection: string): number {
  return COLLECTION_CACHE_CONFIG[collection]?.ttl ?? 60_000;
}

export async function getCache<T>(collection: string, ...parts: string[]): Promise<T | null> {
  try {
    const entry = await localforage.getItem<CacheEntry<T>>(cacheKey(collection, ...parts));
    if (!entry) return null;
    if (entry.version !== CACHE_VERSION) {
      await localforage.removeItem(cacheKey(collection, ...parts));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(collection: string, data: T, ...parts: string[]): Promise<void> {
  const ttl = getTTL(collection);
  const now = Date.now();
  const entry: CacheEntry<T> = {
    data,
    version: CACHE_VERSION,
    cachedAt: now,
    expiresAt: now + ttl,
  };
  try {
    await localforage.setItem(cacheKey(collection, ...parts), entry);
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

export async function removeCache(collection: string, ...parts: string[]): Promise<void> {
  try {
    await localforage.removeItem(cacheKey(collection, ...parts));
  } catch {}
}

export async function clearCache(): Promise<void> {
  const keys: string[] = [];
  await localforage.iterate((_value, key) => {
    if (key.startsWith(CACHE_PREFIX)) keys.push(key);
  });
  await Promise.all(keys.map((k) => localforage.removeItem(k)));
}

export async function isExpired(collection: string, ...parts: string[]): Promise<boolean> {
  try {
    const entry = await localforage.getItem<CacheEntry>(cacheKey(collection, ...parts));
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  } catch {
    return true;
  }
}

export async function refreshCache<T>(
  collection: string,
  fetcher: () => Promise<T>,
  ...parts: string[]
): Promise<T> {
  const data = await fetcher();
  await setCache(collection, data, ...parts);
  return data;
}

export async function getCacheOrFetch<T>(
  collection: string,
  fetcher: () => Promise<T>,
  ...parts: string[]
): Promise<T> {
  const cached = await getCache<T>(collection, ...parts);
  if (cached !== null) {
    const expired = await isExpired(collection, ...parts);
    if (!expired) return cached;
    try {
      const fresh = await refreshCache(collection, fetcher, ...parts);
      return fresh;
    } catch {
      return cached;
    }
  }
  return refreshCache(collection, fetcher, ...parts);
}

export async function compareData<T>(old: T, fresh: T): Promise<boolean> {
  if (old === fresh) return true;
  try {
    return JSON.stringify(old) === JSON.stringify(fresh);
  } catch {
    return false;
  }
}
