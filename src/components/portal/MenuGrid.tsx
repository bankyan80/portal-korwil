'use client';

import { motion } from 'framer-motion';
import {
  School,
  Baby,
  GraduationCap,
  BarChart3,
  FileText,
  Users,
  WalletMinimal,
  Database,
  BookOpen,
  Target,
  CalendarDays,
  FolderOpen,
  Mail,
  Send,
  Globe,
  Phone,
  Clock,
  HeartHandshake,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { useDataStore } from '@/store/data-store';

const iconMap: Record<string, LucideIcon> = {
  School,
  Baby,
  GraduationCap,
  BarChart3,
  FileText,
  Users,
  WalletMinimal,
  Database,
  BookOpen: BookOpen,
  Target,
  CalendarDays,
  FolderOpen,
  Mail,
  Send,
  Globe,
  Phone,
  Clock,
  HeartHandshake,
  Megaphone,
};

const colorPalette = [
  'bg-blue-600', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-600',
  'bg-teal-500', 'bg-blue-700', 'bg-green-600', 'bg-blue-800',
  'bg-amber-500', 'bg-teal-600', 'bg-purple-700', 'bg-orange-600',
  'bg-blue-500', 'bg-green-500', 'bg-pink-500', 'bg-teal-500',
  'bg-red-600', 'bg-indigo-600', 'bg-rose-600', 'bg-cyan-600',
];

const iconHash = (icon: string) => {
  let hash = 0;
  for (let i = 0; i < icon.length; i++) hash = ((hash << 5) - hash) + icon.charCodeAt(i);
  return Math.abs(hash);
};

export default function MenuGrid() {
  const menus = useDataStore((s) => s.menus);
  return (
    <section className="w-full" aria-label="Menu Layanan Pendidikan">
      <div
        className="rounded-t-lg px-4 sm:px-6 py-3"
        className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66]"
      >
        <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide">
          Menu Layanan
        </h2>
      </div>
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {menus.filter((m) => m.active).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)).map((item, idx) => {
            const Icon = iconMap[item.icon] || Globe;
            const color = colorPalette[iconHash(item.icon) % colorPalette.length];
            const description = item.category || '';

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <button
                  onClick={() => {
                    const url = item.url;
                    if (url.startsWith('http')) {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    } else {
                      window.location.href = url;
                    }
                  }}
                  className="w-full flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group text-center"
                  aria-label={item.title}
                >
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg ${color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" strokeWidth={1.8} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold leading-tight" style={{ color: '#0d3b66' }}>
                    {item.title}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 leading-tight line-clamp-2">
                    {description}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
