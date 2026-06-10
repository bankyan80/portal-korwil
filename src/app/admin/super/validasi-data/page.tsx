'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { Shield, LogOut, ArrowLeft, Loader2, CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function SuperValidasiData() {
  const { user } = useAppStore();
  const router = useRouter();
  const [schools, setSchools] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [scRes, stRes, eRes] = await Promise.all([
        fetch('/api/firestore/schools'),
        fetch('/api/firestore/students?limit=10000'),
        fetch('/api/firestore/employees?limit=1000'),
      ]);
      setSchools((await scRes.json()).items || []);
      setStudents((await stRes.json()).items || []);
      setEmployees((await eRes.json()).items || []);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const studentCountBySchool: Record<string, number> = {};
  const employeeCountBySchool: Record<string, number> = {};
  for (const s of students.filter(s => s.statusSiswa === 'Aktif')) {
    studentCountBySchool[s.schoolId] = (studentCountBySchool[s.schoolId] || 0) + 1;
  }
  for (const e of employees.filter(e => e.statusAktif === 'Aktif')) {
    employeeCountBySchool[e.schoolId] = (employeeCountBySchool[e.schoolId] || 0) + 1;
  }

  const validations = schools.map(s => {
    const siswaCount = studentCountBySchool[s.id] || 0;
    const pegawaiCount = employeeCountBySchool[s.id] || 0;
    const errors: string[] = [];
    if (siswaCount === 0) errors.push('Belum ada siswa');
    if (pegawaiCount === 0) errors.push('Belum ada pegawai');
    if (!s.npsn) errors.push('NPSN kosong');
    if (!s.alamat) errors.push('Alamat kosong');
    const overall = errors.length === 0 ? 'Lengkap' : errors.length <= 2 ? 'Kurang' : 'Tidak Lengkap';
    return { id: s.id, namaSekolah: s.namaSekolah, npsn: s.npsn, jenjang: s.jenjang, statusSekolah: s.statusSekolah, siswaCount, pegawaiCount, errors, overall };
  });

  const filtered = validations.filter(v => {
    if (filterStatus !== 'Semua' && v.overall !== filterStatus) return false;
    if (search) return v.namaSekolah?.toLowerCase().includes(search.toLowerCase()) || v.npsn?.includes(search);
    return true;
  });

  const handleToggleValidate = async (schoolId: string) => {
    setProcessing(schoolId);
    try {
      const school = schools.find(s => s.id === schoolId);
      const currentValid = school?.statusValidasi === 'Tervalidasi';
      const res = await fetch('/api/firestore/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: schoolId,
          data: { statusValidasi: currentValid ? 'Belum Validasi' : 'Tervalidasi', updatedAt: new Date().toISOString() },
          merge: true,
        }),
      });
      const json = await res.json();
      if (json.success || json.data) {
        setLoading(true);
        await fetchData();
      }
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setProcessing(null);
    }
  };

  if (!user) return null;

  const lengkap = validations.filter(v => v.overall === 'Lengkap');
  const kurang = validations.filter(v => v.overall === 'Kurang');
  const tdkLengkap = validations.filter(v => v.overall === 'Tidak Lengkap');

  const columns = [
    { key: 'namaSekolah', label: 'Sekolah', render: (r: any) => <span className="font-medium">{r.namaSekolah}</span> },
    { key: 'jenjang', label: 'Jenjang', className: 'text-center' },
    { key: 'siswaCount', label: 'Siswa', className: 'text-center' },
    { key: 'pegawaiCount', label: 'Pegawai', className: 'text-center' },
    {
      key: 'overall', label: 'Kelengkapan', className: 'text-center',
      render: (r: any) => {
        const colors: Record<string, string> = {
          'Lengkap': 'bg-green-100 text-green-700',
          'Kurang': 'bg-amber-100 text-amber-700',
          'Tidak Lengkap': 'bg-red-100 text-red-700',
        };
        return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[r.overall] || ''}`}>{r.overall}</span>;
      },
    },
    {
      key: 'errors', label: 'Masalah', className: 'text-center',
      render: (r: any) => r.errors.length ? (
        <div className="flex flex-col items-center gap-0.5">
          {r.errors.map((e: string, i: number) => <span key={i} className="text-[10px] text-red-600">{e}</span>)}
        </div>
      ) : <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />,
    },
    {
      key: 'actions', label: 'Validasi', className: 'text-center', sortable: false,
      render: (r: any) => {
        const school = schools.find(s => s.id === r.id);
        const isValid = school?.statusValidasi === 'Tervalidasi';
        return (
          <button onClick={() => handleToggleValidate(r.id)} disabled={processing === r.id}
            className={`text-xs px-2 py-1 rounded-lg font-medium ${isValid ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50`}>
            {processing === r.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : isValid ? 'Valid' : 'Set Valid'}
          </button>
        );
      },
    },
  ];

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Validasi Data">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5" /> Validasi Data</h1><p className="text-sm text-blue-200">{user.displayName || ''} • {schools.length} sekolah</p></div>
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
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-3 text-center">
            <p className="text-xl font-bold">{validations.length}</p>
            <p className="text-xs text-muted-foreground">Total Sekolah</p>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <p className="text-xl font-bold text-green-700">{lengkap.length}</p>
            <p className="text-xs text-muted-foreground">Lengkap</p>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{kurang.length}</p>
            <p className="text-xs text-muted-foreground">Kurang</p>
          </div>
          <div className="bg-white rounded-xl border p-3 text-center">
            <p className="text-xl font-bold text-red-700">{tdkLengkap.length}</p>
            <p className="text-xs text-muted-foreground">Tidak Lengkap</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Status</option>
            <option value="Lengkap">Lengkap</option>
            <option value="Kurang">Kurang</option>
            <option value="Tidak Lengkap">Tidak Lengkap</option>
          </select>
        </div>

        {loading ? <LoadingState /> : (
          <DataTable columns={columns} data={filtered} keyExtractor={r => r.id} />
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
