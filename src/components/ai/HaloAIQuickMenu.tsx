import { Search, Users, School, FileText, GraduationCap, FileBarChart, ShieldCheck, BarChart3 } from 'lucide-react';

const quickMenuItems = [
  { id: 'cari-siswa', label: 'Cari Siswa', icon: Search, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', hoverBg: 'hover:bg-blue-100 dark:hover:bg-blue-900/50' },
  { id: 'cari-guru', label: 'Cari Guru', icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50' },
  { id: 'rekap-sekolah', label: 'Rekap Sekolah', icon: School, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', hoverBg: 'hover:bg-purple-100 dark:hover:bg-purple-900/50' },
  { id: 'laporan-bulanan', label: 'Laporan Bulanan', icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-900/50' },
  { id: 'spmb-sd', label: 'SPMB SD', icon: GraduationCap, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30', hoverBg: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/50' },
  { id: 'tka-sd', label: 'TKA SD', icon: FileBarChart, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30', hoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-900/50' },
  { id: 'audit-sistem', label: 'Audit Sistem', icon: ShieldCheck, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', hoverBg: 'hover:bg-orange-100 dark:hover:bg-orange-900/50' },
  { id: 'statistik', label: 'Statistik Pendidikan', icon: BarChart3, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', hoverBg: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/50' },
];

interface HaloAIQuickMenuProps {
  onSelect: (id: string) => void;
}

export default function HaloAIQuickMenu({ onSelect }: HaloAIQuickMenuProps) {
  return (
    <div className="px-2 sm:px-3 py-2 border-t border-gray-100 dark:border-slate-700">
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">Menu Cepat</p>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2">
        {quickMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-2 px-2 sm:px-2.5 py-2 sm:py-2.5 rounded-lg text-xs font-medium transition-colors active:scale-[0.98] ${item.bg} ${item.color} ${item.hoverBg}`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
