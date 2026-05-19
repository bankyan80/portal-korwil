'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import { FirebaseLED } from '@/components/portal/FirebaseLED';
import {
  Users, School, BarChart3, FileText,
  LogOut, Loader2, Building2, RefreshCw, Shield,
  Calendar, Globe, ListTodo, GraduationCap,
  Image, Link2, ArrowLeft, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { allSekolah } from '@/data/sekolah';
import { normalizeSchool } from '@/lib/normalize';

export default function SuperAdminDashboard() {
  const { user, setUser } = useAppStore();
  const router = useRouter();

  const { data: allStudents } = useCachedFirestore<Record<string, any>>({
    collectionName: 'students',
    realtime: false,
    enabled: true,
  });
  const { data: allEmployees } = useCachedFirestore<Record<string, any>>({
    collectionName: 'employees',
    realtime: false,
    enabled: true,
  });

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [sheetsSyncing, setSheetsSyncing] = useState(false);
  const [sheetsSyncMsg, setSheetsSyncMsg] = useState('');
  const [createSheetsLoading, setCreateSheetsLoading] = useState(false);
  const [createSheetsMsg, setCreateSheetsMsg] = useState('');
  const [createSheetsUrl, setCreateSheetsUrl] = useState('');
  const [autoSyncStatus, setAutoSyncStatus] = useState<{ lastSynced?: string; url?: string; counts?: Record<string, number> } | null>(null);
  const [laporanData, setLaporanData] = useState<any[]>([]);

  const currentYear = new Date().getFullYear();
  const bulanList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const statusConfig: Record<string, { label: string; className: string }> = {
    belum_lapor: { label: 'Belum Lapor', className: 'bg-gray-100 text-gray-600' },
    sudah_dikirim: { label: 'Sudah Dikirim', className: 'bg-green-100 text-green-700' },
    perlu_revisi: { label: 'Perlu Revisi', className: 'bg-red-100 text-red-700' },
    sudah_lapor: { label: 'Sudah Lapor', className: 'bg-blue-100 text-blue-700' },
    diverifikasi: { label: 'Diverifikasi', className: 'bg-green-100 text-green-700' },
    revisi: { label: 'Revisi', className: 'bg-red-100 text-red-700' },
  };

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/sync/all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(data.message);
      } else {
        setSyncMsg(data.error || 'Gagal sinkronisasi');
      }
    } catch {
      setSyncMsg('Gagal terhubung ke server');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 5000);
    }
  }, []);

  const handleSheetsSync = useCallback(async () => {
    setSheetsSyncing(true);
    setSheetsSyncMsg('');
    try {
      const res = await fetch('/api/sync/google-sheets', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const parts = Object.entries(data)
          .filter(([k]) => k !== 'success')
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        setSheetsSyncMsg(`Berhasil! ${parts}`);
      } else {
        setSheetsSyncMsg(data.error || 'Gagal sync ke Google Sheets');
      }
    } catch {
      setSheetsSyncMsg('Gagal terhubung ke server');
    } finally {
      setSheetsSyncing(false);
      setTimeout(() => setSheetsSyncMsg(''), 8000);
    }
  }, []);

  const handleCreateSheets = useCallback(async () => {
    setCreateSheetsLoading(true);
    setCreateSheetsMsg('');
    setCreateSheetsUrl('');
    try {
      const res = await fetch('/api/cron/sync-sheets', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCreateSheetsUrl(data.spreadsheetUrl);
        setCreateSheetsMsg(`Auto-sync berhasil! ${Object.entries(data.counts || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
        fetchAutoSyncStatus();
      } else {
        setCreateSheetsMsg(data.error || 'Gagal trigger auto-sync');
      }
    } catch {
      setCreateSheetsMsg('Gagal terhubung ke server');
    } finally {
      setCreateSheetsLoading(false);
      setTimeout(() => setCreateSheetsMsg(''), 10000);
    }
  }, []);

  const fetchAutoSyncStatus = useCallback(async () => {
    try {
      const { getFirestore, collection, query, doc, getDoc } = await import('firebase/firestore');
      if (!db) return;
      const configRef = doc(db, 'system_config', 'google_sheets_config');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setAutoSyncStatus(configSnap.data());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchAutoSyncStatus(); }, [fetchAutoSyncStatus]);

  const schools = useMemo(() => {
    const set = new Set<string>();
    if (allStudents) {
      for (const s of allStudents) {
        const name = s.sekolah || s.schoolName || '';
        if (name) set.add(name);
      }
    }
    if (allEmployees) {
      for (const e of allEmployees) {
        const name = e.sekolah || e.schoolName || '';
        if (name) set.add(name);
      }
    }
    return Array.from(set).sort();
  }, [allStudents, allEmployees]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') router.push('/login');
  }, [user, router]);

  // Realtime listener for laporan bulanan
  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, 'laporan_bulanan'), (snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setLaporanData(items);
    }, (err) => { console.error('Error in laporan listener:', err); });
    return () => unsub();
  }, []);

  // Build report matrix: rows = schools, columns = months
  const reportMatrix = useMemo(() => {
    const matrix: { sekolah: string; jenjang: string; months: Record<string, any> }[] = [];
    for (const sekolah of allSekolah) {
      const months: Record<string, any> = {};
      for (const bulan of bulanList) {
        const report = laporanData.find((r) => {
          if (r.tahun !== currentYear) return false;
          if (r.bulan !== bulan) return false;
          const matchSchoolId = r.sekolahId === sekolah.npsn;
          const matchSchoolName = normalizeSchool(r.sekolah || '') === normalizeSchool(sekolah.nama);
          return matchSchoolId || matchSchoolName;
        });
        months[bulan] = report || null;
      }
      matrix.push({ sekolah: sekolah.nama, jenjang: sekolah.jenjang, months });
    }
    return matrix;
  }, [laporanData]);

  const sudahLaporCount = reportMatrix.filter((s) =>
    bulanList.some((b) => s.months[b] && (s.months[b].status === 'sudah_dikirim' || s.months[b].status === 'diverifikasi'))
  ).length;

  if (!user) return null;

  function handleLogout() {
    if (auth) auth.signOut();
    setUser(null);
    router.push('/');
  }

  const menu = [
    { label: 'Data GTK', icon: Users, desc: 'Seluruh data PTK & tendik', count: allEmployees?.length, href: '/admin/super/data-guru', color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Data Siswa', icon: Users, desc: 'Seluruh data peserta didik', count: allStudents?.length, href: '/admin/super/data-siswa', color: 'bg-violet-100 text-violet-700' },
    { label: 'Data Sekolah', icon: GraduationCap, desc: 'Profil & informasi sekolah', href: '/admin/super/sekolah', color: 'bg-blue-100 text-blue-700' },
    { label: 'Laporan Bulanan', icon: FileText, desc: 'Monitoring laporan bulanan sekolah', href: '/admin/super/laporan-bulanan', color: 'bg-orange-100 text-orange-700' },
    { label: 'Tugas', icon: ListTodo, desc: 'Buat & monitor tugas sekolah', href: '/admin/super/tugas', color: 'bg-indigo-100 text-indigo-700' },
    { label: 'Kelola User', icon: Shield, desc: 'Atur pengguna & role akses', href: '/admin/super/users', color: 'bg-purple-100 text-purple-700' },
    { label: 'Galeri', icon: Image, desc: 'Atur galeri foto semua kategori', href: '/admin/super/galeri', color: 'bg-pink-100 text-pink-700' },
    { label: 'Organisasi', icon: Globe, desc: 'Kelola data & kepengurusan organisasi', href: '/admin/super/organisasi', color: 'bg-teal-100 text-teal-700' },
    { label: 'Link Instansi', icon: Link2, desc: 'Atur tautan instansi terkait', href: '/admin/super/link-instansi', color: 'bg-amber-100 text-amber-700' },
    { label: 'Kalender', icon: Calendar, desc: 'Kalender kegiatan', href: '/kalender', color: 'bg-red-100 text-red-700' },

  ];

  const isStatsLoading = !allStudents || !allEmployees;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" /> Dashboard Super Admin
          </h1>
          <p className="text-sm text-blue-200">{user.displayName} • {user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Menyinkronkan...' : 'Sinkronisasi Data'}
          </button>
          <button onClick={handleSheetsSync} disabled={sheetsSyncing}
            className="flex items-center gap-2 text-sm text-green-300 hover:text-green-200 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${sheetsSyncing ? 'animate-spin' : ''}`} />
            {sheetsSyncing ? 'Sync Sheets...' : 'Sync ke Sheets'}
          </button>
          <button onClick={handleCreateSheets} disabled={createSheetsLoading}
            className="flex items-center gap-2 text-sm text-yellow-300 hover:text-yellow-200 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${createSheetsLoading ? 'animate-spin' : ''}`} />
            {createSheetsLoading ? 'Syncing...' : 'Trigger Auto Sync'}
          </button>
          <button onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200">
            <ArrowLeft className="w-4 h-4" /> Portal
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <FirebaseLED userLabel={user.email} />

      {syncMsg && (
        <div className="px-6 pt-4 max-w-7xl mx-auto">
          <div className="px-4 py-2 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-700">
            {syncMsg}
          </div>
        </div>
      )}
      {sheetsSyncMsg && (
        <div className="px-6 pt-4 max-w-7xl mx-auto">
          <div className="px-4 py-2 rounded-lg text-sm bg-green-50 border border-green-200 text-green-700">
            {sheetsSyncMsg}
          </div>
        </div>
      )}
      {createSheetsMsg && (
        <div className="px-6 pt-4 max-w-7xl mx-auto">
          <div className="px-4 py-2 rounded-lg text-sm bg-yellow-50 border border-yellow-200 text-yellow-700">
            {createSheetsMsg}
            {createSheetsUrl && (
              <a href={createSheetsUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline font-medium">
                Buka Spreadsheet →
              </a>
            )}
          </div>
        </div>
      )}

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <School className="w-5 h-5 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sekolah</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isStatsLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : schools.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pegawai</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isStatsLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : allEmployees?.length ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-700 dark:text-violet-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Siswa</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isStatsLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : allStudents?.length ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Tersinkron</p>
                <p className="text-2xl font-bold text-green-600">Ya</p>
              </div>
            </div>
          </div>
        </div>

        {autoSyncStatus?.url && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto Sync Google Sheets</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Jadwal: Setiap hari pukul 02:00 WIB •
                  Terakhir sync: {autoSyncStatus.lastSynced ? new Date(autoSyncStatus.lastSynced).toLocaleString('id-ID') : 'Belum pernah'}
                </p>
                {autoSyncStatus.counts && (
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {Object.entries(autoSyncStatus.counts).map(([k, v]) => (
                      <span key={k}>{k}: {v}</span>
                    ))}
                  </div>
                )}
              </div>
              <a href={autoSyncStatus.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                <FileText className="w-4 h-4" /> Buka Spreadsheet
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menu.map((item) => (
            <a key={item.label} href={item.href}
              className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 text-left hover:shadow-md transition-shadow block">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.label}</p>
                  {item.count !== undefined && (
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {isStatsLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : item.count}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Riwayat Laporan Bulanan - Matrix per Sekolah */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Riwayat Laporan Bulanan {currentYear}</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-600" /> Sudah Lapor: {sudahLaporCount}</span>
              <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-gray-400" /> Belum: {allSekolah.length - sudahLaporCount}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold text-muted-foreground sticky left-0 bg-muted/50 z-10">Sekolah</th>
                  {bulanList.map((b) => (
                    <th key={b} className="px-2 py-2 text-center font-semibold text-muted-foreground text-xs">{b.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportMatrix.map((row) => (
                  <tr key={row.sekolah} className="hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2 font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{row.sekolah}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{row.jenjang}</span>
                      </div>
                    </td>
                    {bulanList.map((b) => {
                      const report = row.months[b];
                      const status = report?.status || 'belum_lapor';
                      const sc = statusConfig[status] || statusConfig.belum_lapor;
                      return (
                        <td key={b} className="px-2 py-2 text-center">
                          {report ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full ${sc.className}`}>
                              {sc.label}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t text-xs text-muted-foreground">
            Menampilkan {allSekolah.length} sekolah • Tahun {currentYear}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
            Selamat datang, Super Admin
          </h2>
          <p className="text-sm text-muted-foreground">
            Mengelola {schools.length} sekolah dengan total {allStudents?.length ?? 0} siswa dan {allEmployees?.length ?? 0} pegawai.
            Gunakan tombol <strong>Sinkronisasi Data</strong> untuk memperbarui data dari file statis ke Firestore.
          </p>
          {schools.length > 0 && (
            <details className="mt-3">
              <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-700">Lihat daftar sekolah</summary>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {schools.map((s) => (
                  <div key={s} className="text-sm text-gray-600 dark:text-gray-400 px-2 py-1">{s}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      </main>
    </div>
  );
}
