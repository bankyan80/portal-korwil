'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { ClipboardList, LogOut, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SuperSirubin() {
  const { user } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/firestore/sirubin_reports')
      .then(r => r.json())
      .then(json => { if (json.items) setData(json.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const bulanIni = new Date().getMonth() + 1;
  const tahunIni = new Date().getFullYear();
  const laporanBulanIni = data.filter(r => r.bulan === bulanIni && r.tahun === tahunIni);
  const sudah = laporanBulanIni.filter(r => r.statusLaporan === 'Terkirim' || r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci');

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="SIRUBIN">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><ClipboardList className="w-5 h-5" /> SIRUBIN</h1><p className="text-sm text-blue-200">{user.displayName}</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold">{laporanBulanIni.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
              <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-green-700">{sudah.length}</p><p className="text-xs text-muted-foreground">Sudah Kirim</p></div>
              <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-red-700">{laporanBulanIni.length - sudah.length}</p><p className="text-xs text-muted-foreground">Belum Kirim</p></div>
              <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold">{laporanBulanIni.length ? Math.round((sudah.length / laporanBulanIni.length) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Progres</p></div>
            </div>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left">Sekolah</th><th className="px-3 py-2 text-center">Jenjang</th><th className="px-3 py-2 text-center">Status</th><th className="px-3 py-2 text-center">Tanggal</th></tr></thead>
                <tbody className="divide-y">
                  {laporanBulanIni.map(r => (
                    <tr key={r.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{r.namaSekolah || r.sekolah}</td>
                      <td className="px-3 py-2 text-center">{r.jenjang}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci' ? 'bg-green-100 text-green-700' :
                          r.statusLaporan === 'Terkirim' ? 'bg-blue-100 text-blue-700' :
                          r.statusLaporan === 'Perlu Perbaikan' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{r.statusLaporan || 'Belum Dibuat'}</span>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('id-ID') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
