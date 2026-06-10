'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { ClipboardList, LogOut, ArrowLeft, Loader2, CheckCircle, XCircle, Send, Lock } from 'lucide-react';
import { ExportButton } from '@/components/shared/ExportButton';
import AuthGuard from '@/components/auth/AuthGuard';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';

const bulanList = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

export default function SuperSirubin() {
  const { user } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('Semua');

  const fetchData = useCallback(async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        fetch('/api/firestore/sirubin_reports'),
        fetch('/api/firestore/schools'),
      ]);
      const rJson = await rRes.json();
      const sJson = await sRes.json();
      setData(rJson.items || []);
      setSchools(sJson.items || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const bulanIni = filterBulan;
  const tahunIni = filterTahun;
  const laporanFiltered = data.filter(r => r.bulan === bulanIni && r.tahun === tahunIni);

  const filtered = laporanFiltered.filter(r => {
    if (filterStatus !== 'Semua' && r.statusLaporan !== filterStatus) return false;
    return true;
  });

  const handleValidate = async (id: string, status: string) => {
    setProcessing(id);
    try {
      await fetch('/api/firestore/sirubin_reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          data: { statusLaporan: status, validatedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          merge: true,
        }),
      });
      setLoading(true);
      await fetchData();
    } catch {} finally {
      setProcessing(null);
    }
  };

  const schoolsWithoutReport = schools.filter(s => !laporanFiltered.find(r => r.schoolId === s.id));
  const sudah = laporanFiltered.filter(r => r.statusLaporan === 'Terkirim' || r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci');
  const valid = laporanFiltered.filter(r => r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci');

  if (!user) return null;

  const columns = [
    { key: 'namaSekolah', label: 'Sekolah', render: (r: any) => <span className="font-medium">{r.namaSekolah || r.sekolah}</span> },
    { key: 'jenjang', label: 'Jenjang', className: 'text-center' },
    {
      key: 'status', label: 'Status', className: 'text-center',
      render: (r: any) => {
        const s = r.statusLaporan || 'Belum Dibuat';
        const colors: Record<string, string> = {
          'Valid': 'bg-green-100 text-green-700',
          'Terkunci': 'bg-green-100 text-green-700',
          'Terkirim': 'bg-blue-100 text-blue-700',
          'Perlu Perbaikan': 'bg-red-100 text-red-700',
        };
        return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>;
      },
    },
    {
      key: 'tanggal', label: 'Tgl Kirim', className: 'text-center',
      render: (r: any) => <span className="text-xs">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('id-ID') : '-'}</span>,
    },
    {
      key: 'catatan', label: 'Catatan', className: 'text-center',
      render: (r: any) => <span className="text-xs text-muted-foreground">{r.catatan || '-'}</span>,
    },
    {
      key: 'actions', label: 'Aksi', className: 'text-center', sortable: false,
      render: (r: any) => {
        if (r.statusLaporan === 'Terkunci') return <span className="text-xs text-muted-foreground">Terkunci</span>;
        return (
          <div className="flex items-center justify-center gap-2">
            {r.statusLaporan !== 'Valid' && (
              <button onClick={() => handleValidate(r.id, 'Valid')} disabled={processing === r.id}
                className="p-1.5 rounded hover:bg-green-50 text-green-600 disabled:opacity-50">
                {processing === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            )}
            {r.statusLaporan !== 'Perlu Perbaikan' && (
              <button onClick={() => handleValidate(r.id, 'Perlu Perbaikan')} disabled={processing === r.id}
                className="p-1.5 rounded hover:bg-red-50 text-red-600 disabled:opacity-50">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
            {r.statusLaporan === 'Valid' && (
              <button onClick={() => handleValidate(r.id, 'Terkunci')} disabled={processing === r.id}
                className="p-1.5 rounded hover:bg-purple-50 text-purple-600 disabled:opacity-50">
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

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
        <div className="grid grid-cols-5 gap-3">
          {[{ label: 'Total Sekolah', value: schools.length, color: '' },
            { label: 'Total Laporan', value: laporanFiltered.length, color: '' },
            { label: 'Sudah Kirim', value: sudah.length, color: 'text-green-700' },
            { label: 'Tervalidasi', value: valid.length, color: 'text-purple-700' },
            { label: 'Belum Lapor', value: schoolsWithoutReport.length, color: 'text-red-700' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select value={filterBulan} onChange={e => setFilterBulan(Number(e.target.value))} className="px-3 py-2 rounded-lg border text-sm bg-white">
            {bulanList.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
          <input type="number" value={filterTahun} onChange={e => setFilterTahun(Number(e.target.value))} className="px-3 py-2 rounded-lg border text-sm bg-white w-24" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Status</option>
            <option value="Terkirim">Terkirim</option>
            <option value="Valid">Valid</option>
            <option value="Terkunci">Terkunci</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
          </select>
          <span className="text-sm text-muted-foreground flex items-center">
            {schoolsWithoutReport.length} sekolah belum lapor
          </span>
          <ExportButton collection="sirubin_reports" />
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} message="Tidak ada laporan untuk periode ini" />
        ) : (
          <DataTable columns={columns} data={filtered} keyExtractor={r => r.id} />
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
