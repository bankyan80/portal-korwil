'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { ClipboardList, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorSirubin() {
  const { user } = useAppStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) { setLoading(false); return; }
    fetch(`/api/firestore/sirubin_reports?field=schoolId&value=${user.schoolId}`)
      .then(r => r.json())
      .then(json => { if (json.items) setData(json.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="SIRUBIN">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-lg font-bold flex items-center gap-2 mb-4"><ClipboardList className="w-5 h-5" /> SIRUBIN</h1>
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : (
          <p className="text-muted-foreground">Riwayat laporan: {data.length}</p>
        )}
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
