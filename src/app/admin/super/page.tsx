'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import {
  Users, School, BarChart3, FileText, Image, Megaphone,
  LogOut, Loader2, Building2, RefreshCw, Settings, Shield,
  Calendar, BookOpen, Globe, Newspaper, ListTodo
} from 'lucide-react';

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

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') router.push('/login');
  }, [user, router]);

  if (!user) return null;

  function handleLogout() {
    if (auth) auth.signOut();
    setUser(null);
    router.push('/');
  }

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

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

  const menu = [
    { label: 'Semua Sekolah', icon: School, desc: 'Daftar & kelola profil sekolah', href: '/admin/operator/data-siswa', color: 'bg-blue-100 text-blue-700' },
    { label: 'Data Guru', icon: Users, desc: 'Kelola PTK & tendik semua sekolah', count: allEmployees?.length, href: '/admin/operator/data-guru', color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Data Siswa', icon: Users, desc: 'Kelola peserta didik semua sekolah', count: allStudents?.length, href: '/admin/operator/data-siswa', color: 'bg-violet-100 text-violet-700' },
    { label: 'Lapor Bulanan', icon: FileText, desc: 'Monitoring laporan bulanan sekolah', href: '/admin/operator/laporan-bulanan', color: 'bg-orange-100 text-orange-700' },
    { label: 'Rekap Kelas', icon: BarChart3, desc: 'Rekapitulasi kelas otomatis', href: '/admin/operator/rekap-kelas', color: 'bg-cyan-100 text-cyan-700' },
    { label: 'Sarpras', icon: Building2, desc: 'Data sarana & prasarana', href: '/admin/operator/sarpras', color: 'bg-amber-100 text-amber-700' },
    { label: 'SPMB', icon: BookOpen, desc: 'Penerimaan peserta didik baru', href: '/admin/operator/spmb', color: 'bg-rose-100 text-rose-700' },
    { label: 'Berita', icon: Newspaper, desc: 'Berita & pengumuman', href: '/admin/operator/berita', color: 'bg-indigo-100 text-indigo-700' },
    { label: 'Galeri', icon: Image, desc: 'Dokumentasi kegiatan', href: '/admin/operator/galeri', color: 'bg-pink-100 text-pink-700' },
    { label: 'Organisasi', icon: Globe, desc: 'Kelola organisasi & agenda', href: '/admin/organisasi', color: 'bg-teal-100 text-teal-700' },
    { label: 'Kalender', icon: Calendar, desc: 'Kalender kegiatan', href: '/kalender', color: 'bg-red-100 text-red-700' },
    { label: 'Validasi Data', icon: BarChart3, desc: 'Cek kelengkapan data per sekolah', href: '/admin/super/validator', color: 'bg-red-100 text-red-700' },
    { label: 'Tugas', icon: ListTodo, desc: 'Buat & monitor tugas sekolah', href: '/admin/super/tugas', color: 'bg-indigo-100 text-indigo-700' },
    { label: 'Settings', icon: Settings, desc: 'Pengaturan sistem', href: '#', color: 'bg-gray-100 text-gray-700' },
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
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {syncMsg && (
        <div className="px-6 pt-4 max-w-7xl mx-auto">
          <div className="px-4 py-2 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-700">
            {syncMsg}
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
