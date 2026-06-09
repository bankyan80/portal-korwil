'use client';

import { Search } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  jenjang: string;
  onJenjangChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  extraFilters?: { value: string; label: string; onChange: (v: string) => void; options: FilterOption[] }[];
}

export function FilterBar({
  search, onSearchChange, searchPlaceholder = 'Cari...',
  jenjang, onJenjangChange,
  status, onStatusChange,
  extraFilters,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" placeholder={searchPlaceholder}
          value={search} onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800"
        />
      </div>
      <select value={jenjang} onChange={e => onJenjangChange(e.target.value)}
        className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
        <option value="Semua">Semua Jenjang</option>
        <option value="SD">SD</option>
        <option value="TK">TK</option>
        <option value="KB">KB</option>
      </select>
      <select value={status} onChange={e => onStatusChange(e.target.value)}
        className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
        <option value="Semua">Negeri/Swasta</option>
        <option value="Negeri">Negeri</option>
        <option value="Swasta">Swasta</option>
      </select>
      {extraFilters?.map((f, i) => (
        <select key={i} value={f.value} onChange={e => f.onChange(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
    </div>
  );
}
