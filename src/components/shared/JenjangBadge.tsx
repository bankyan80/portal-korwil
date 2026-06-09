import { cn } from '@/lib/utils';

const jenjangStyles: Record<string, string> = {
  SD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  TK: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  KB: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
};

interface JenjangBadgeProps {
  jenjang: string;
  className?: string;
}

export function JenjangBadge({ jenjang, className }: JenjangBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full',
      jenjangStyles[jenjang] || 'bg-gray-100 text-gray-600',
      className,
    )}>
      {jenjang}
    </span>
  );
}
