import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  message?: string;
}

export function EmptyState({ icon: Icon = Inbox, message = 'Tidak ada data ditemukan' }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
