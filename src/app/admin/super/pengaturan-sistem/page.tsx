'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { Settings, LogOut, ArrowLeft } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SuperPengaturanSistem() {
  const { user } = useAppStore();
  const router = useRouter();
  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Pengaturan Sistem">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5" /> Pengaturan Sistem</h1><p className="text-sm text-blue-200">{user.displayName}</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <p className="text-muted-foreground">Pengaturan sistem, tahun pelajaran, periode, dan maintenance.</p>
      </main>
    </div>
    </AuthGuard>
  );
}
