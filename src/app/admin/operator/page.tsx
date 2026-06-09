'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/app-store';
import { School, Users, BookOpen, MapPin, ClipboardList, BarChart3, FileText, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

const menuCards = [
  { label: 'Profil Sekolah', icon: School, desc: 'Profil sekolah/lembaga', href: '/admin/operator/profil-sekolah', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'SIMDAWA', icon: Users, desc: 'Data siswa', href: '/admin/operator/simdawa', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'SIMPEG', icon: BookOpen, desc: 'Data pegawai', href: '/admin/operator/simpeg', color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Mapping Pegawai', icon: MapPin, desc: 'Kebutuhan pegawai', href: '/admin/operator/mapping-pegawai', color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'SIRUBIN', icon: ClipboardList, desc: 'Laporan bulanan', href: '/admin/operator/sirubin', color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Rekap Sekolah', icon: BarChart3, desc: 'Rekap data sekolah', href: '/admin/operator/rekap-sekolah', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { label: 'Catatan Perbaikan', icon: FileText, desc: 'Catatan dari admin', href: '/admin/operator/catatan-perbaikan', color: 'text-orange-600', bg: 'bg-orange-50' },
];

export default function OperatorDashboard() {
  const { user } = useAppStore();

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Dashboard Operator">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-0 sm:p-2">
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Beranda Operator</h1>
          <p className="text-sm text-muted-foreground">{user.schoolName || user.displayName}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
