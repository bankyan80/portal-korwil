import { cn } from '@/lib/utils';

interface HaloAIStatusProps {
  status: 'online' | 'slow' | 'error' | 'checking';
  remaining?: number;
  total?: number;
}

const statusConfig = {
  online: { color: 'bg-green-500', glow: 'shadow-green-500/50', label: 'AI Online' },
  slow: { color: 'bg-yellow-500', glow: 'shadow-yellow-500/50', label: 'Quota Menipis' },
  error: { color: 'bg-red-500', glow: 'shadow-red-500/50', label: 'AI Tidak Tersambung' },
  checking: { color: 'bg-yellow-400', glow: 'shadow-yellow-400/50', label: 'Memeriksa...' },
};

export default function HaloAIStatus({ status, remaining, total }: HaloAIStatusProps) {
  const config = statusConfig[status];
  const showQuota = typeof remaining === 'number' && typeof total === 'number';
  const pct = showQuota ? Math.round((remaining / total) * 100) : 100;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          {status === 'online' && (
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full', config.color, 'opacity-75')} />
          )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', config.color, 'shadow-sm', config.glow)} />
        </span>
        <span className={cn(
          'text-[11px] font-medium',
          status === 'online' ? 'text-green-400' :
          status === 'slow' ? 'text-yellow-400' :
          status === 'error' ? 'text-red-400' : 'text-yellow-300'
        )}>
          {config.label}
        </span>
      </div>
      {showQuota && (
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pct > 50 ? 'bg-green-500' : pct > 20 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{remaining}/{total}</span>
        </div>
      )}
    </div>
  );
}
