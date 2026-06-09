'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { MapPin, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorMappingPegawai() {
  const { user } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) { setLoading(false); return; }
    fetch(`/api/firestore/employee_mappings?field=schoolId&value=${user.schoolId}`)
      .then(r => r.json())
      .then(json => { if (json.items?.length) setData(json.items[0]); else if (json.data) setData(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Mapping Pegawai">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto">
        <h1 className="text-lg font-bold flex items-center gap-2 mb-4"><MapPin className="w-5 h-5" /> Mapping Pegawai</h1>
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600" /> : data ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-2">
            <p>Sekolah: {data.namaSekolah}</p>
            <p>Tersedia: {data.totalPegawaiTersedia || 0}</p>
            <p>Kebutuhan: {data.totalKebutuhanIdeal || 0}</p>
            <p>Status: {(data.totalPegawaiTersedia || 0) - (data.totalKebutuhanIdeal || 0) < 0 ? 'Kurang' : (data.totalPegawaiTersedia || 0) - (data.totalKebutuhanIdeal || 0) > 0 ? 'Lebih' : 'Cukup'}</p>
          </div>
        ) : <p className="text-muted-foreground">Data mapping belum tersedia.</p>}
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
