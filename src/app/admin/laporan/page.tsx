'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { hasPermission } from '@/lib/permissions';
import SuperPageShell from '@/components/admin/SuperPageShell';
import { ManageLaporanBulanan } from '@/components/admin/ManageLaporanBulanan';
import { ArrowLeft } from 'lucide-react';

export default function AdminLaporanPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  if (!user || !hasPermission(user.role, 'view-reports')) {
    router.push('/login');
    return null;
  }

  if (user.role === 'super_admin') {
    return (
      <SuperPageShell title="Laporan & Ekspor" subtitle="Monitoring laporan bulanan sekolah">
        <ManageLaporanBulanan />
      </SuperPageShell>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-300 hover:text-blue-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white">Laporan Bulanan</h1>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <ManageLaporanBulanan />
      </main>
    </div>
  );
}
