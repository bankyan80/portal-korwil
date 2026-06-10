'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { ClipboardList, Send, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

const bulanList = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

export default function OperatorSirubin() {
  const { user } = useAppStore();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [targetBulan, setTargetBulan] = useState(new Date().getMonth() + 1);
  const [targetTahun, setTargetTahun] = useState(new Date().getFullYear());
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const fetchData = useCallback(async () => {
    if (!user?.schoolId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/firestore/sirubin_reports?field=schoolId&value=${user.schoolId}`);
      const json = await res.json();
      setReports(json.items || []);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const existingReport = reports.find(r => r.bulan === targetBulan && r.tahun === targetTahun);
  const canSubmit = !existingReport || existingReport.statusLaporan === 'Perlu Perbaikan';

  const handleSubmit = async () => {
    if (!user?.schoolId || !canSubmit || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/firestore/sirubin_reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingReport?.id || undefined,
          data: {
            schoolId: user.schoolId,
            namaSekolah: user.schoolName || '',
            jenjang: user.jenjang || '',
            bulan: targetBulan,
            tahun: targetTahun,
            statusLaporan: 'Terkirim',
            submittedAt: new Date().toISOString(),
            catatan,
            updatedAt: new Date().toISOString(),
          },
          merge: true,
        }),
      });
      const json = await res.json();
      if (json.success || json.data) {
        setShowForm(false);
        setCatatan('');
        setLoading(true);
        await fetchData();
      }
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Valid': case 'Terkunci': return 'bg-green-100 text-green-700';
      case 'Terkirim': return 'bg-blue-100 text-blue-700';
      case 'Perlu Perbaikan': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="SIRUBIN">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <h1 className="text-lg font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5" /> SIRUBIN</h1>
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold">{reports.length}</p>
            <p className="text-xs text-muted-foreground">Total Laporan</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{reports.filter(r => r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci').length}</p>
            <p className="text-xs text-muted-foreground">Tervalidasi</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{reports.filter(r => r.statusLaporan === 'Terkirim').length}</p>
            <p className="text-xs text-muted-foreground">Terkirim</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{reports.filter(r => r.statusLaporan === 'Perlu Perbaikan').length}</p>
            <p className="text-xs text-muted-foreground">Perlu Perbaikan</p>
          </div>
        </div>

        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
          <Send className="w-4 h-4" /> Kirim Laporan Bulanan
        </button>

        {loading ? <LoadingState /> : reports.length === 0 ? (
          <EmptyState icon={ClipboardList} message="Belum ada laporan yang dikirim" />
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left">Periode</th><th className="px-3 py-2 text-center">Status</th><th className="px-3 py-2 text-center">Tanggal Kirim</th><th className="px-3 py-2 text-center">Catatan</th></tr></thead>
              <tbody className="divide-y">
                {[...reports].sort((a, b) => (b.tahun - a.tahun) || (b.bulan - a.bulan)).map(r => (
                  <tr key={r.id} className="hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium">{bulanList.find(b => b.value === r.bulan)?.label || r.bulan} {r.tahun}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(r.statusLaporan)}`}>{r.statusLaporan || 'Belum Dibuat'}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-xs">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="px-3 py-2 text-center text-xs">{r.catatan || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Kirim Laporan Bulanan</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {existingReport && !canSubmit && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Laporan sudah dikirim</p>
                    <p className="text-xs text-green-600">Status: {existingReport.statusLaporan}</p>
                  </div>
                </div>
              )}
              {existingReport?.statusLaporan === 'Perlu Perbaikan' && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">Laporan sebelumnya perlu perbaikan. Silakan kirim ulang.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Bulan</label>
                <select value={targetBulan} onChange={e => setTargetBulan(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border text-sm">
                  {bulanList.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tahun</label>
                <input type="number" value={targetTahun} onChange={e => setTargetTahun(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Catatan</label>
                <textarea value={catatan} onChange={e => setCatatan(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm" rows={3} placeholder="Isi catatan laporan..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSubmit} disabled={!canSubmit || sending}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                {existingReport ? 'Kirim Ulang' : 'Kirim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
