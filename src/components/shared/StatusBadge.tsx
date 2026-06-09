import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  // Sirubin
  'Belum Dibuat': 'bg-gray-100 text-gray-600',
  Draft: 'bg-yellow-100 text-yellow-700',
  Terkirim: 'bg-blue-100 text-blue-700',
  'Perlu Perbaikan': 'bg-red-100 text-red-700',
  Valid: 'bg-green-100 text-green-700',
  Terkunci: 'bg-green-100 text-green-700',
  // Umum
  Aktif: 'bg-green-100 text-green-700',
  Nonaktif: 'bg-gray-100 text-gray-600',
  // Mapping
  Cukup: 'bg-green-100 text-green-700',
  Kurang: 'bg-red-100 text-red-700',
  Lebih: 'bg-amber-100 text-amber-700',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
      statusStyles[status] || 'bg-gray-100 text-gray-600',
      className,
    )}>
      {status}
    </span>
  );
}
