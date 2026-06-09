'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { Shield, LogOut, ArrowLeft } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SuperValidasiData() {
  const { user } = useAppStore();
  const router = useRouter();
  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Validasi Data">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5" /> Validasi Data</h1><p className="text-sm text-blue-200">{user.displayName}</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <p className="text-muted-foreground">Validasi data sekolah/lembaga, siswa, dan pegawai.</p>
      </main>
    </div>
    </AuthGuard>
  );
}
