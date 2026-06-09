'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { BarChart3, LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SuperRekapPendidikan() {
  const { user } = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Rekap Pendidikan">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Rekap Pendidikan</h1><p className="text-sm text-blue-200">{user.displayName}</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" /> : (
          <div className="bg-white rounded-xl border p-6">
            <p className="text-muted-foreground">Rekap Pendidikan — akan diisi dengan data agregat dari seluruh menu.</p>
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
