'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { MapPin, LogOut, ArrowLeft, Loader2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { ExportButton } from '@/components/shared/ExportButton';
import AuthGuard from '@/components/auth/AuthGuard';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';

export default function SuperMappingPegawai() {
  const { user } = useAppStore();
  const router = useRouter();
  const [mappings, setMappings] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [mRes, sRes] = await Promise.all([
        fetch('/api/firestore/employee_mappings'),
        fetch('/api/firestore/schools'),
      ]);
      const mJson = await mRes.json();
      const sJson = await sRes.json();
      setMappings(mJson.items || []);
      setSchools(sJson.items || []);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const [eRes, sRes] = await Promise.all([
        fetch('/api/firestore/employees'),
        fetch('/api/firestore/students?limit=10000'),
      ]);
      const employees = (await eRes.json()).items || [];
      const students = (await sRes.json()).items || [];

      let created = 0;
      for (const school of schools) {
        const pegawaiSekolah = employees.filter((e: any) => e.schoolId === school.id && e.statusAktif === 'Aktif');
        const siswaSekolah = students.filter((s: any) => s.schoolId === school.id && s.statusSiswa === 'Aktif');
        const totalGuruIdeal = Math.ceil(siswaSekolah.length / 20);
        const totalTendikIdeal = 2;

        const existing = mappings.find(m => m.schoolId === school.id);
        await fetch('/api/firestore/employee_mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: existing?.id || undefined,
            data: {
              schoolId: school.id,
              namaSekolah: school.namaSekolah,
              jenjang: school.jenjang,
              npsn: school.npsn,
              totalPegawaiTersedia: pegawaiSekolah.length,
              totalPegawaiAktif: pegawaiSekolah.length,
              totalKebutuhanIdeal: totalGuruIdeal + totalTendikIdeal,
              totalGuruIdeal,
              totalTendikIdeal,
              rincianJabatan: jabatanRincian(pegawaiSekolah),
              updatedAt: new Date().toISOString(),
            },
            merge: true,
          }),
        });
        created++;
      }
      setMessage(`Sync selesai: ${created} sekolah diproses`);
      setLoading(true);
      await fetchData();
    } catch (e: any) { setError(e.message || 'Gagal sync'); setMessage('Gagal sync'); } finally {
      setSyncing(false);
    }
  };

  const jabatanRincian = (pegawai: any[]) => {
    const rincian: Record<string, number> = {};
    for (const p of pegawai) {
      rincian[p.jabatan] = (rincian[p.jabatan] || 0) + 1;
    }
    return rincian;
  };

  if (!user) return null;

  const columns = [
    { key: 'namaSekolah', label: 'Sekolah', render: (r: any) => <span className="font-medium">{r.namaSekolah}</span> },
    { key: 'jenjang', label: 'Jenjang', className: 'text-center' },
    { key: 'totalPegawaiTersedia', label: 'Tersedia', className: 'text-center' },
    { key: 'totalKebutuhanIdeal', label: 'Kebutuhan', className: 'text-center' },
    {
      key: 'selisih', label: '+/-', className: 'text-center',
      render: (r: any) => {
        const selisih = (r.totalPegawaiTersedia || 0) - (r.totalKebutuhanIdeal || 0);
        return <span className={`font-bold ${selisih < 0 ? 'text-red-600' : selisih > 0 ? 'text-green-600' : ''}`}>{selisih > 0 ? `+${selisih}` : selisih}</span>;
      },
    },
    {
      key: 'status', label: 'Status', className: 'text-center',
      render: (r: any) => {
        const selisih = (r.totalPegawaiTersedia || 0) - (r.totalKebutuhanIdeal || 0);
        if (selisih < 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Kurang</span>;
        if (selisih > 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Lebih</span>;
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Cukup</span>;
      },
    },
  ];

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Mapping Pegawai">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><MapPin className="w-5 h-5" /> Mapping Pegawai</h1><p className="text-sm text-blue-200">{user.displayName} • {mappings.length} sekolah</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? 'Menghitung...' : 'Sync Ulang'}
            </button>
            {message && (
              <span className={`text-sm ${message.includes('selesai') ? 'text-green-700' : 'text-red-700'}`}>{message}</span>
            )}
            <ExportButton collection="employee_mappings" />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Rata-rata: {mappings.length ? Math.round(mappings.filter(m => (m.totalPegawaiTersedia || 0) >= (m.totalKebutuhanIdeal || 0)).length / mappings.length * 100) : 0}% tercukupi</span>
          </div>
        </div>

        {loading ? <LoadingState /> : mappings.length === 0 ? (
          <EmptyState icon={MapPin} message="Belum ada data mapping. Klik Sync Ulang untuk menghitung." />
        ) : (
          <DataTable columns={columns} data={mappings} keyExtractor={r => r.id} />
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
