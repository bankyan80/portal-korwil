'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { School, LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorProfilSekolah() {
  const { user } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) { setLoading(false); return; }
    fetch(`/api/firestore/schools?id=${user.schoolId}`)
      .then(r => r.json())
      .then(json => { if (json.data) setData(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Profil Sekolah">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto">
        {loading ? <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" /> : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-3">
            <h2 className="font-bold text-lg">{data?.namaSekolah || user.schoolName || '-'}</h2>
            <p className="text-sm text-muted-foreground">NPSN: {data?.npsn || '-'} • {data?.jenjang || '-'} • {data?.statusSekolah || '-'}</p>
            <p className="text-sm text-muted-foreground">{data?.alamat}, {data?.desa}, {data?.kecamatan || 'Lemahabang'}</p>
          </div>
        )}
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
