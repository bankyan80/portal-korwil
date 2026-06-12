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
  IdCard,
  type LucideIcon,
} from 'lucide-react';
import { useDataStore } from '@/store/data-store';
import { mockMenus } from '@/lib/mock-data';

const iconMap: Record<string, LucideIcon> = {
  School, Baby, GraduationCap, BarChart3, FileText, Users,
  WalletMinimal, Database, BookOpen, Target, CalendarDays,
  FolderOpen, Mail, Send, Globe, Phone, Clock,
  HeartHandshake, Megaphone, IdCard,
};

const colorClasses = [
  { bg: 'bg-blue-50 dark:bg-blue-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-800/30', btn: 'bg-blue-700 hover:bg-blue-800' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-800/30', btn: 'bg-emerald-700 hover:bg-emerald-800' },
  { bg: 'bg-violet-50 dark:bg-violet-950/30', iconBg: 'bg-violet-100 dark:bg-violet-900/50', iconColor: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200/50 dark:border-violet-800/30', btn: 'bg-violet-700 hover:bg-violet-800' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-800/30', btn: 'bg-amber-700 hover:bg-amber-800' },
  { bg: 'bg-rose-50 dark:bg-rose-950/30', iconBg: 'bg-rose-100 dark:bg-rose-900/50', iconColor: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200/50 dark:border-rose-800/30', btn: 'bg-rose-700 hover:bg-rose-800' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/30', iconBg: 'bg-cyan-100 dark:bg-cyan-900/50', iconColor: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200/50 dark:border-cyan-800/30', btn: 'bg-cyan-700 hover:bg-cyan-800' },
];

const iconHash = (icon: string) => {
  let hash = 0;
  for (let i = 0; i < icon.length; i++) hash = ((hash << 5) - hash) + icon.charCodeAt(i);
  return Math.abs(hash);
};

export default function MenuGrid() {
  const menus = useDataStore((s) => s.menus);
  const items = menus.length > 0 ? menus : mockMenus;
  const filtered = items.filter((m) => m.active).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  if (filtered.length === 0) return null;

  return (
    <section className="w-full" aria-label="Menu Layanan Pendidikan">
      <div className="rounded-t-lg px-4 sm:px-6 py-3 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide">
          Menu Layanan
        </h2>
      </div>
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((item, idx) => {
            const Icon = iconMap[item.icon] || Globe;
            const colors = colorClasses[iconHash(item.icon) % colorClasses.length];
            const isExternal = item.url.startsWith('http');
            const cat = item.category || '';

            const card = (
              <div
                className={`group relative flex flex-col rounded-xl border ${colors.border} ${colors.bg} p-4 sm:p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${colors.iconBg} shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {item.title}
                    </h3>
                    {cat && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {cat}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 group-hover:gap-2 transition-all">
                  <span>Buka Layanan</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: idx * 0.03 }}
              >
                {isExternal ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.title}>
                    {card}
                  </a>
                ) : (
                  <a href={item.url} aria-label={item.title}>
                    {card}
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
