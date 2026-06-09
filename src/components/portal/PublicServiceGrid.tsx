'use client';

import { School, Users, MapPin, ClipboardList, BarChart3, BookOpen, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ServiceCard {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  href: string;
  badges: { label: string; variant: 'jenjang' | 'status' }[];
}

const services: ServiceCard[] = [
  {
    id: 'master-data-sekolah',
    label: 'Master Data Sekolah',
    icon: School,
    desc: 'Data satuan pendidikan SD, TK, dan KB Negeri/Swasta di Kecamatan Lemahabang.',
    href: '/master-data-sekolah',
    badges: [
      { label: 'SD', variant: 'jenjang' },
      { label: 'TK', variant: 'jenjang' },
      { label: 'KB', variant: 'jenjang' },
      { label: 'Negeri', variant: 'status' },
      { label: 'Swasta', variant: 'status' },
    ],
  },
  {
    id: 'simdawa',
    label: 'SIMDAWA',
    icon: Users,
    desc: 'Sistem Informasi Manajemen Data Warga Sekolah untuk data siswa/peserta didik.',
    href: '/simdawa',
    badges: [
      { label: 'SD', variant: 'jenjang' },
      { label: 'TK', variant: 'jenjang' },
      { label: 'KB', variant: 'jenjang' },
    ],
  },
  {
    id: 'simpeg',
    label: 'SIMPEG',
    icon: BookOpen,
    desc: 'Sistem Informasi Manajemen Pegawai untuk guru, pendidik, tendik, kepala sekolah/lembaga, dan operator.',
    href: '/simpeg',
    badges: [
      { label: 'SD', variant: 'jenjang' },
      { label: 'TK', variant: 'jenjang' },
      { label: 'KB', variant: 'jenjang' },
    ],
  },
  {
    id: 'mapping-pegawai',
    label: 'Mapping Pegawai',
    icon: MapPin,
    desc: 'Pemetaan kebutuhan, kekurangan, dan kelebihan pegawai setiap sekolah/lembaga.',
    href: '/mapping-pegawai',
    badges: [
      { label: 'SD', variant: 'jenjang' },
      { label: 'TK', variant: 'jenjang' },
      { label: 'KB', variant: 'jenjang' },
    ],
  },
  {
    id: 'sirubin',
    label: 'SIRUBIN',
    icon: ClipboardList,
    desc: 'Sistem Rutin Bulanan untuk laporan bulanan SD, TK, dan KB.',
    href: '/sirubin',
    badges: [
      { label: 'SD', variant: 'jenjang' },
      { label: 'TK', variant: 'jenjang' },
      { label: 'KB', variant: 'jenjang' },
    ],
  },
  {
    id: 'rekap-pendidikan',
    label: 'Rekap Pendidikan',
    icon: BarChart3,
    desc: 'Rekap gabungan data pendidikan Kecamatan Lemahabang berdasarkan data valid.',
    href: '/rekap-pendidikan',
    badges: [
      { label: 'SD', variant: 'jenjang' },
      { label: 'TK', variant: 'jenjang' },
      { label: 'KB', variant: 'jenjang' },
    ],
  },
];

const colorClasses = [
  { bg: 'bg-blue-50 dark:bg-blue-950/30', iconBg: 'bg-blue-100 dark:bg-blue-900/50', iconColor: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-800/30', btn: 'bg-blue-700 hover:bg-blue-800' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-800/30', btn: 'bg-emerald-700 hover:bg-emerald-800' },
  { bg: 'bg-violet-50 dark:bg-violet-950/30', iconBg: 'bg-violet-100 dark:bg-violet-900/50', iconColor: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200/50 dark:border-violet-800/30', btn: 'bg-violet-700 hover:bg-violet-800' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-800/30', btn: 'bg-amber-700 hover:bg-amber-800' },
  { bg: 'bg-rose-50 dark:bg-rose-950/30', iconBg: 'bg-rose-100 dark:bg-rose-900/50', iconColor: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200/50 dark:border-rose-800/30', btn: 'bg-rose-700 hover:bg-rose-800' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/30', iconBg: 'bg-cyan-100 dark:bg-cyan-900/50', iconColor: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200/50 dark:border-cyan-800/30', btn: 'bg-cyan-700 hover:bg-cyan-800' },
];

export default function PublicServiceGrid() {
  return (
    <section className="w-full py-12 sm:py-16 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            LAYANAN
          </h2>
          <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-blue-700" />
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Portal Pendidikan Kecamatan Lemahabang — Kelompok Kerja Kepala Sekolah/Musyawarah Kerja Kepala Sekolah
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {services.map((item, i) => {
            const colors = colorClasses[i % colorClasses.length];
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group relative flex flex-col rounded-xl border ${colors.border} ${colors.bg} p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors.iconBg} shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-6 h-6 ${colors.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {item.label}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.badges.map((b) => (
                    <span
                      key={b.label}
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${
                        b.variant === 'jenjang'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 group-hover:gap-2 transition-all">
                  <span>Buka Layanan</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
