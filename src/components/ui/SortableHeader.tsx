'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import type { SortDir } from '@/hooks/useSort';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentKey: string | null;
  direction: SortDir;
  onToggle: (key: string) => void;
  className?: string;
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SortableHeader({
  label, sortKey, currentKey, direction, onToggle, className = '', hideBelow,
}: SortableHeaderProps) {
  const isActive = currentKey === sortKey;
  const hideClass = hideBelow ? ` hidden ${hideBelow === 'xl' ? 'xl:table-cell' : hideBelow === 'lg' ? 'lg:table-cell' : hideBelow === 'md' ? 'md:table-cell' : 'sm:table-cell'}` : '';

  return (
    <th
      onClick={() => onToggle(sortKey)}
      className={`cursor-pointer select-none px-4 py-3 text-left font-semibold text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${hideClass} ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30" />
        )}
      </span>
    </th>
  );
}
