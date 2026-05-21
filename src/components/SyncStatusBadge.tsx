'use client';

import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { CloudOff, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function SyncStatusBadge() {
  const { count, processing, processAll } = useOfflineQueue();
  const [showDetail, setShowDetail] = useState(false);

  if (count === 0 && !processing) return null;

  return (
    <div className="relative">
      <button
        onClick={() => { if (count > 0) setShowDetail(!showDetail); }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium cursor-pointer
          ${processing
            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300'
          }`}
      >
        {processing
          ? <Loader2 className="w-3 h-3 animate-spin" />
          : <CloudOff className="w-3 h-3" />
        }
        {processing ? 'Sinkronisasi...' : `${count} menunggu`}
      </button>

      {showDetail && count > 0 && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-3 text-xs space-y-2 z-50">
          <p className="text-gray-600 dark:text-gray-300">
            {count} operasi gagal terkirim. Koneksi mungkin terputus.
          </p>
          <button
            onClick={async () => {
              await processAll();
              setShowDetail(false);
            }}
            className="w-full flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs"
          >
            <RefreshCw className="w-3 h-3" /> Sinkronisasi Ulang
          </button>
        </div>
      )}
    </div>
  );
}
