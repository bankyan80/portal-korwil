'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { BarChart3, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorRekapSekolah() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Rekap Sekolah">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-lg font-bold flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5" /> Rekap Sekolah/Lembaga</h1>
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : (
          <p className="text-muted-foreground">Rekap data {user.schoolName || 'sekolah/lembaga'}.</p>
        )}
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
