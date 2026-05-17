/**
 * FirebaseLED — global connection-status indicator.
 *
 * Shows a small pill/badge:
 *   🟢 green  = connected
 *   🔴 red    = disconnected
 *   🟡 amber  = connecting / unknown
 *   ⛔ grey   = browser offline
 *
 * Probes Firestore by reading one doc from the `menus` collection.
 * Status is updated every 30 s so a dropped connection shows as
 * "disconnected" even when the browser is online.
 * Clicking the pill shows a tooltip with the last sync timestamp.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, query, limit, getDocs,
} from 'firebase/firestore';
import { Wifi, WifiOff, Loader2, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Status = 'connected' | 'disconnected' | 'connecting' | 'offline_browser';

// Module-level var — remembered across renders
let lastRefresh = 0;

export function getLastRefresh(): number {
  return lastRefresh;
}

export function touchRefresh(): void {
  lastRefresh = Date.now();
}

/** Try a 1-doc read against the `menus` collection to confirm the wire is up. */
async function probeFirestore(firestoreDb: ReturnType<typeof import('firebase/firestore').getFirestore>): Promise<boolean> {
  try {
    await getDocs(query(collection(firestoreDb, 'menus'), limit(1)));
    return true;
  } catch {
    return false;
  }
}

export function FirebaseLED({
  userLabel,
  schoolLabel,
}: {
  userLabel?: string;
  schoolLabel?: string;
}) {
  const [browserOnline, setBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [status, setStatus] = useState<Status>('connecting');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── helpers ─────────────────────────────────────────────── */

  const updateStatus = useCallback(async () => {
    if (!browserOnline) {
      setStatus('offline_browser');
      return;
    }
    if (!db) {
      setStatus('connecting');
      return;
    }
    try {
      const ok = await probeFirestore(db);
      setStatus(ok ? 'connected' : 'disconnected');
    } catch {
      setStatus('disconnected');
    }
  }, [browserOnline]);

  const refresh = useCallback(() => {
    touchRefresh();
    setLastSync(Date.now());
    updateStatus();
  }, [updateStatus]);

  /* ── browser online / offline events ─────────────────── */

  useEffect(() => {
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  /* ── initial status probe ────────────────────────────── */

  useEffect(() => {
    queueMicrotask(() => {
      updateStatus();
      lastRefresh = Date.now();
      setLastSync(lastRefresh);
    });
  }, [updateStatus]);

  /* ── periodic probe (every 30 s) ────────────────────── */

  useEffect(() => {
    timerRef.current = setInterval(updateStatus, 30_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [updateStatus]);

  /* ── render ─────────────────────────────────────────── */

  const colors: Record<Status, string> = {
    connected: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    disconnected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    connecting: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    offline_browser: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  };

  const Icon = status === 'connected'
    ? Wifi
    : status === 'offline_browser'
      ? WifiOff
      : Loader2;

  const label = {
    connected: 'Firebase Terhubung',
    disconnected: 'Firebase Terputus',
    connecting: 'Firebase Menghubungkan…',
    offline_browser: 'Offline',
  }[status];

  const syncLabel = lastSync
    ? (() => {
        const diff = Math.floor((Date.now() - lastSync) / 1000);
        if (diff < 60) return `${diff} detik yang lalu`;
        if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
        return `${Math.floor(diff / 3600)} jam yang lalu`;
      })()
    : () => '—';

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1">
      {/* Compact LED pill */}
      <div
        role="status"
        tabIndex={0}
        onClick={() => setShowTooltip(!showTooltip)}
        onKeyDown={(e) => e.key === 'Enter' && setShowTooltip(!showTooltip)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors select-none ${colors[status]}`}
        title={label}
        aria-label={label}
      >
        <Icon
          className={`w-3.5 h-3.5 shrink-0 ${status === 'connecting' ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{label}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-3 w-56 text-xs space-y-2 animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">
              Sinkron terakhir: <strong>{syncLabel}</strong>
            </span>
          </div>
          {userLabel && (
            <div className="text-gray-500 dark:text-gray-400">
              User: <span className="font-medium text-gray-700 dark:text-gray-200">{userLabel}</span>
            </div>
          )}
          {schoolLabel && (
            <div className="text-gray-500 dark:text-gray-400">
              Sekolah: <span className="font-medium text-gray-700 dark:text-gray-200">{schoolLabel}</span>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs gap-1"
            onClick={(e) => { e.stopPropagation(); refresh(); }}
          >
            <RefreshCw className="w-3 h-3" /> Perbarui
          </Button>
        </div>
      )}
    </div>
  );
}
