import { cn } from '@/lib/utils';

interface HaloAIStatusProps {
  status: 'online' | 'slow' | 'error' | 'checking';
}

const statusConfig = {
  online: { color: 'bg-green-500', glow: 'shadow-green-500/50', label: 'AI Online' },
  slow: { color: 'bg-yellow-500', glow: 'shadow-yellow-500/50', label: 'Koneksi Lambat' },
  error: { color: 'bg-red-500', glow: 'shadow-red-500/50', label: 'AI Tidak Tersambung' },
  checking: { color: 'bg-yellow-400', glow: 'shadow-yellow-400/50', label: 'Memeriksa...' },
};

export default function HaloAIStatus({ status }: HaloAIStatusProps) {
  const config = statusConfig[status];
  return (
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
  );
}
