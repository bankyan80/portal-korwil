'use client';

import { Check, Loader2, AlertTriangle, Save } from 'lucide-react';
import type { AutoSaveStatus } from '@/hooks/useAutoSaveForm';

export function AutoSaveStatusBadge({ status }: { status: AutoSaveStatus }) {
  if (status === 'idle') return null;

  const config: Record<AutoSaveStatus, { icon: typeof Check; label: string; color: string }> = {
    idle: { icon: Save, label: '', color: '' },
    saving: { icon: Loader2, label: 'Menyimpan...', color: 'text-amber-600 dark:text-amber-400' },
    saved: { icon: Check, label: 'Tersimpan', color: 'text-emerald-600 dark:text-emerald-400' },
    error: { icon: AlertTriangle, label: 'Gagal menyimpan', color: 'text-red-600 dark:text-red-400' },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${c.color}`}>
      <Icon className={`w-3 h-3 ${status === 'saving' ? 'animate-spin' : ''}`} />
      {c.label}
    </span>
  );
}
