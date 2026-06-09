'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/app-store';
import { Shield, School, Users, BookOpen, MapPin, ClipboardList, BarChart3, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

const menuCards = [
  { label: 'Master Data Sekolah', icon: School, desc: 'Kelola data SD/TK/KB', href: '/admin/super/master-data-sekolah', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'SIMDAWA', icon: Users, desc: 'Data siswa/peserta didik', href: '/admin/super/simdawa', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'SIMPEG', icon: BookOpen, desc: 'Data pegawai', href: '/admin/super/simpeg', color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Mapping Pegawai', icon: MapPin, desc: 'Kebutuhan pegawai', href: '/admin/super/mapping-pegawai', color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'SIRUBIN', icon: ClipboardList, desc: 'Laporan bulanan', href: '/admin/super/sirubin', color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Rekap Pendidikan', icon: BarChart3, desc: 'Rekap data kecamatan', href: '/admin/super/rekap-pendidikan', color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

export default function SuperAdminDashboard() {
  const { user } = useAppStore();

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Dashboard Super Admin">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5" /> Beranda Super Admin</h1>
        <p className="text-sm text-blue-200">{user.displayName} • {user.email}</p>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}
                className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${item.bg} group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
