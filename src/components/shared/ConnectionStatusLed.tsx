'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ConnectionStatusLed() {
  const [status, setStatus] = useState<'hijau' | 'kuning' | 'merah'>('kuning');

  useEffect(() => {
    const check = async () => {
      try {
        const start = Date.now();
        const res = await fetch('/api/firestore/schools?limit=1', { signal: AbortSignal.timeout(5000) });
        const ms = Date.now() - start;
        if (!res.ok) { setStatus('merah'); return; }
        setStatus(ms > 2000 ? 'kuning' : 'hijau');
      } catch {
        setStatus('merah');
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const colorMap = {
    hijau: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]',
    kuning: 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]',
    merah: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
  };

  return (
    <div className="flex items-center gap-1.5" title={`Koneksi database: ${status}`}>
      <span className={cn('w-2 h-2 rounded-full inline-block animate-pulse', colorMap[status])} />
      <span className="text-[10px] text-muted-foreground hidden sm:inline">
        {status === 'hijau' ? 'Tersambung' : status === 'kuning' ? 'Lambat' : 'Putus'}
      </span>
    </div>
  );
}
