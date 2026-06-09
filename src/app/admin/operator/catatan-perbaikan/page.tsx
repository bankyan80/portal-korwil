'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { FileText, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorCatatanPerbaikan() {
  const { user } = useAppStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) { setLoading(false); return; }
    fetch(`/api/firestore/correction_notes?field=schoolId&value=${user.schoolId}`)
      .then(r => r.json())
      .then(json => { if (json.items) setData(json.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Catatan Perbaikan">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-lg font-bold flex items-center gap-2 mb-4"><FileText className="w-5 h-5" /> Catatan Perbaikan</h1>
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : data.length === 0 ? (
          <p className="text-muted-foreground">Tidak ada catatan perbaikan.</p>
        ) : (
          <div className="space-y-2">
            {data.map(c => (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border p-4">
                <p className="text-sm">{c.catatan}</p>
                <p className="text-xs text-muted-foreground mt-1">Status: {c.status || 'Diajukan'}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
