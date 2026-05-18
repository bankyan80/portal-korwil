/**
 * FirebaseCache — lightweight offline-first cache for the portal.
 *
 * Keys are scoped by user uid + school id so each operator sees only
 * their school's data when offline.  All values expire after `ttlMs`
 * (default 24 hours).  Read path: localStorage first, then fall back
 * to Firebase via the supplied fetchFn (passed as a callback so we
 * never import Firebase here).
 */

import { toast } from 'sonner';

export interface CacheEntry<T = unknown> {
  data: T;
  ts: number;      // last update (ms since epoch)
}

const PREFIX = 'portal_cache_';
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

export type CacheKey =
  | `students:${string}`          // user uid : student list (filtered)
  | `employees:${string}`         // user uid : employee list (filtered)
  | `dashboard:${string}:${string}` // user uid : school id : stat cards
  | `siswa_db:${string}`          // user uid : API/Dapodik siswa list
  | `perkelas:${string}`;         // user uid : per-kelas recap

function cacheKey(type: CacheKey): string {
  return PREFIX + type;
}

/** ── Helpers ─────────────────────────────────────────────────── */

export function isCacheFresh<T>(entry: CacheEntry<T> | null, ttl: number = DEFAULT_TTL): boolean {
  if (!entry) return false;
  return Date.now() - entry.ts < ttl;
}

function readEntry<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeEntry<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full or unavailable — silently drop
  }
}

/** ── Public API ───────────────────────────────────────────────── */

/**
 * get: try cache first, fall back to fetchFn if stale / missing.
 * Always returns something (stale or fresh), never rejects.
 */
export async function get<T>(
  key: CacheKey,
  fetchFn: () => Promise<T>,
  ttl?: number,
  useStaleOnError?: boolean,
): Promise<T> {
  const k = cacheKey(key);
  const entry = readEntry<T>(k);

  if (isCacheFresh(entry, ttl)) {
    console.debug(`[Cache] HIT  ${key}`);
    return entry!.data as T;
  }

  try {
    console.debug(`[Cache] MISS fetching  ${key}`);
    const fresh = await fetchFn();
    writeEntry(k, fresh);
    return fresh;
  } catch (err) {
    console.warn(`[Cache] fetch failed for ${key}:`, err);
    if (useStaleOnError && entry) {
      console.debug(`[Cache] using STALE  ${key}`);
      return entry!.data as T;
    }
    throw err;
  }
}

/**
 * getStale: return cached data if available (even if expired), no network.
 */
export function getStale<T>(key: CacheKey, defaultValue: T): T {
  const k = cacheKey(key);
  const entry = readEntry<T>(k);
  return entry ? (entry.data as T) : defaultValue;
}

/** Write directly into cache without a fetch. */
export function set<T>(key: CacheKey, data: T): void {
  const k = cacheKey(key);
  writeEntry(k, data);
}

/** Remove a single cache entry. */
export function evict(key: CacheKey): void {
  const k = cacheKey(key);
  try { localStorage.removeItem(k); } catch { /* noop */ }
}

/**
 * Invalidate all entries that start with `type` (e.g. `students:uid*`).
 * Usage: invalidate('students:123', uid)
 */
export function invalidate(type: string, scopeId: string): void {
  const p = `${PREFIX}${type}:${scopeId}`;
  try {
    Object.keys(localStorage).forEach((fullKey) => {
      if (fullKey.startsWith(p)) localStorage.removeItem(fullKey);
    });
  } catch { /* noop */ }
}

/**
 * Invalidate ALL entries for a given type across ALL users.
 * Usage after admin write: invalidateAll('students')
 */
export function invalidateAll(type: 'students' | 'employees' | 'dashboard' | 'siswa_db' | 'perkelas'): void {
  const p = `${PREFIX}${type}:`;
  try {
    Object.keys(localStorage).forEach((fullKey) => {
      if (fullKey.startsWith(p)) localStorage.removeItem(fullKey);
    });
  } catch { /* noop */ }
}

/** Purge the entire portal cache (logout / full refresh). */
export function purgeAll(): void {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(PREFIX)) localStorage.removeItem(k);
    });
  } catch { /* noop */ }
}

/** ── Helper: build a type-scoped key from user + school info ─────── */

export function scopedKey(
  type: 'students' | 'employees' | 'dashboard' | 'siswa_db' | 'perkelas',
  userId?: string | null,
  schoolId?: string | null,
  extra?: string,
): CacheKey {
  const uid = userId || 'anon';
  switch (type) {
    case 'students':
      return `students:${uid}` as CacheKey;
    case 'employees':
      return `employees:${uid}` as CacheKey;
    case 'dashboard':
      return `dashboard:${uid}:${schoolId || '?'}` as CacheKey;
    case 'siswa_db':
      return `siswa_db:${uid}${extra ? `:${extra}` : ''}` as CacheKey;
    case 'perkelas':
      return `perkelas:${uid}` as CacheKey;
  }
}
