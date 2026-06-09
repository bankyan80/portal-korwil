'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { MapPin, LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SuperMappingPegawai() {
  const { user } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/firestore/employee_mappings')
      .then(r => r.json())
      .then(json => { if (json.items) setData(json.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Mapping Pegawai">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5" /> Mapping Pegawai</h1><p className="text-sm text-blue-200">{user.displayName}</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left">Sekolah</th><th className="px-3 py-2 text-center">Jenjang</th><th className="px-3 py-2 text-center">Tersedia</th><th className="px-3 py-2 text-center">Kebutuhan</th><th className="px-3 py-2 text-center">+/-</th><th className="px-3 py-2 text-center">Status</th></tr></thead>
              <tbody className="divide-y">
                {data.map(m => {
                  const selisih = (m.totalPegawaiTersedia || 0) - (m.totalKebutuhanIdeal || 0);
                  return (
                    <tr key={m.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{m.namaSekolah}</td>
                      <td className="px-3 py-2 text-center">{m.jenjang}</td>
                      <td className="px-3 py-2 text-center">{m.totalPegawaiTersedia || 0}</td>
                      <td className="px-3 py-2 text-center">{m.totalKebutuhanIdeal || 0}</td>
                      <td className={`px-3 py-2 text-center font-bold ${selisih < 0 ? 'text-red-600' : selisih > 0 ? 'text-green-600' : ''}`}>{selisih > 0 ? `+${selisih}` : selisih}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${selisih < 0 ? 'bg-red-100 text-red-700' : selisih > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {selisih < 0 ? 'Kurang' : selisih > 0 ? 'Lebih' : 'Cukup'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
