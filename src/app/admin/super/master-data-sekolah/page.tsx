'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { School, LogOut, ArrowLeft, Plus, Search, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SuperMasterDataSekolah() {
  const { user } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/firestore/schools')
      .then(r => r.json())
      .then(json => { if (json.items) setData(json.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const filtered = data.filter(s =>
    s.namaSekolah?.toLowerCase().includes(search.toLowerCase()) ||
    s.npsn?.includes(search)
  );

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Master Data Sekolah">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><School className="w-5 h-5" /> Master Data Sekolah</h1>
          <p className="text-sm text-blue-200">{user.displayName}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800"><Plus className="w-4 h-4" /> Tambah Sekolah</button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left">Nama Sekolah</th><th className="px-3 py-2 text-center">NPSN</th><th className="px-3 py-2 text-center">Jenjang</th><th className="px-3 py-2 text-center">Status</th><th className="px-3 py-2 text-center">Desa</th><th className="px-3 py-2 text-center">Aktif</th></tr></thead>
              <tbody className="divide-y">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{s.namaSekolah}</td>
                    <td className="px-3 py-2 text-center">{s.npsn}</td>
                    <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' : s.jenjang === 'TK' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{s.jenjang}</span></td>
                    <td className="px-3 py-2 text-center">{s.statusSekolah}</td>
                    <td className="px-3 py-2 text-center">{s.desa}</td>
                    <td className="px-3 py-2 text-center">{s.isActive !== false ? '✓' : '✗'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
