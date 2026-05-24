'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import { normalizeSchool } from '@/lib/normalize';
import { Users, School, BarChart3, FileText, Image, Megaphone, LogOut, Loader2, Building2, ListTodo, CheckCircle, ExternalLink, Clock, Heart, FolderOpen } from 'lucide-react';
import { FirebaseLED } from '@/components/portal/FirebaseLED';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import AuthGuard from '@/components/auth/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorDashboard() {
  const { user, setUser } = useAppStore();
  const router = useRouter();
  const { isLoadingAuth } = useAppStore();

  const { data: allStudents, loading: studentsLoading } = useCachedFirestore<Record<string, any>>({
    collectionName: 'students',
    realtime: true,
    enabled: !!user?.schoolName,
  });
  const { data: allEmployees, loading: employeesLoading } = useCachedFirestore<Record<string, any>>({
    collectionName: 'employees',
    realtime: true,
    enabled: !!user?.schoolName,
  });

  const calculatedCounts = useMemo(() => {
    const schoolName = user?.schoolName;
    const schoolId = user?.schoolId;
    if (!schoolName && !schoolId) return { sCount: 0, eCount: 0 };
    const normalized = normalizeSchool(schoolName || '');
    let sCount = 0;
    let eCount = 0;
    for (const d of allStudents) {
      if (d.schoolId === schoolId || normalizeSchool(d.sekolah || d.schoolName || '') === normalized) {
        sCount++;
      }
    }
    for (const d of allEmployees) {
      if (d.schoolId === schoolId || normalizeSchool(d.sekolah || d.schoolName || '') === normalized) {
        eCount++;
      }
    }
    return { sCount, eCount };
  }, [allStudents, allEmployees, user?.schoolName, user?.schoolId]);

  const [tugasList, setTugasList] = useState<any[]>([]);
  const [tugasLoading, setTugasLoading] = useState(true);
  const [laporanHistory, setLaporanHistory] = useState<any[]>([]);

  const bulanList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const statusList = [
    { value: 'belum_lapor', label: 'Belum Lapor', className: 'bg-gray-100 text-gray-600' },
    { value: 'sudah_lapor', label: 'Sudah Dikirim', className: 'bg-green-100 text-green-700' },
    { value: 'revisi', label: 'Perlu Revisi', className: 'bg-red-100 text-red-700' },
  ];

  const fetchTugas = useCallback(async () => {
    if (!user?.schoolId && !user?.schoolName) return;
    setTugasLoading(true);
    try {
      const res = await fetch('/api/tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-operator',
          schoolId: user?.schoolId || '',
          schoolName: user?.schoolName || '',
        }),
      });
      const json = await res.json();
      if (json.success) setTugasList(json.tasks);
    } catch (e) { console.error(e); } finally { setTugasLoading(false); }
  }, [user?.schoolId, user?.schoolName]);

  useEffect(() => {
    fetchTugas();
  }, [fetchTugas]);

  // Fetch laporan bulanan history
  useEffect(() => {
    if (!db || (!user?.schoolId && !user?.schoolName)) return;
    const schoolId = user.schoolId || normalizeSchool(user?.schoolName || '').replace(/\s+/g, '-');
    const q = query(collection(db, 'laporan_bulanan'), where('sekolahId', '==', schoolId));
    getDocs(q).then((snap) => {
      const items: any[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || (bulanList.indexOf(a.bulan || '') - bulanList.indexOf(b.bulan || '')));
      setLaporanHistory(items);
    }).catch((err) => { console.error('Error fetching laporan history:', err); });
  }, [user?.schoolId, user?.schoolName]);

  const handleCompleteTask = useCallback(async (taskId: string) => {
    try {
      await fetch('/api/tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          taskId,
          schoolId: user?.schoolId || '',
          schoolName: user?.schoolName || '',
        }),
      });
      await fetchTugas();
    } catch (e) { console.error(e); }
  }, [user?.schoolId, user?.schoolName, fetchTugas]);

  const isStatsLoading = studentsLoading || employeesLoading;

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Memuat...</span>
        </div>
      </div>
    );
  }

  if (!user || user.role === 'publik') {
    router.replace('/login');
    return null;
  }

  function handleLogout() {
    if (auth) auth.signOut();
    setUser(null);
    router.push('/');
  }

  const menu = [
    { label: 'Profil Sekolah', icon: School, desc: 'Kelola data sekolah', count: null, href: '/admin/operator/profil-sekolah' },
    { label: 'Data Guru', icon: Users, desc: 'Kelola data pendidik dan tenaga kependidikan', count: calculatedCounts.eCount, href: '/admin/operator/data-guru' },
    { label: 'Data Siswa', icon: Users, desc: 'Kelola data peserta didik', count: calculatedCounts.sCount, href: '/admin/operator/data-siswa' },
    { label: 'Tambah Siswa', icon: School, desc: 'Daftarkan siswa baru', count: null, href: '/admin/operator/tambah-siswa' },
    { label: 'SPMB', icon: FileText, desc: 'Penerimaan peserta didik baru', count: null, href: '/admin/operator/spmb' },
    { label: 'Upload Berita', icon: Megaphone, desc: 'Kirim berita sekolah', count: null, href: '/admin/operator/berita' },
    { label: 'Upload Galeri', icon: Image, desc: 'Dokumentasi kegiatan sekolah', count: null, href: '/admin/operator/galeri' },
    { label: 'Dokumen Bersama', icon: FolderOpen, desc: 'Upload dan kelola dokumen pegawai', count: null, href: '/admin/operator/dokumen' },
    { label: 'Sarpras', icon: Building2, desc: 'Data sarana dan prasarana sekolah', count: null, href: '/admin/operator/sarpras' },
    { label: 'Lapor Bulanan', icon: FileText, desc: 'Cetak & kirim laporan bulanan sekolah', count: null, href: '/admin/operator/laporan-bulanan' },
    { label: 'Data Yatim Piatu', icon: Heart, desc: 'Kelola data siswa yatim piatu', count: null, href: '/admin/operator/yatim-piatu' },
  ];

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Dashboard Operator">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-0 sm:p-2">
      <FirebaseLED userLabel={user.displayName} schoolLabel={user.schoolName} />
      <div className="fixed bottom-20 right-4 z-40"><SyncStatusBadge /></div>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menu.slice(0, 4).map((item) => (
            <a key={item.label} href={item.href}
              className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 text-left hover:shadow-md transition-shadow block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.label}</p>
                  {item.count !== null && (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isStatsLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : item.count}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {menu.slice(4).map((item) => (
            <a key={item.label} href={item.href}
              className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 text-left hover:shadow-md transition-shadow block">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Tugas dari Super Admin */}
        {!tugasLoading && tugasList.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b bg-blue-50 dark:bg-blue-900/20 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-700" />
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Tugas dari Admin</h3>
            </div>
            <div className="divide-y">
              {tugasList.map((t: any) => (
                <div key={t.id} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</p>
                    {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.completed ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Selesai
                      </span>
                    ) : (
                      <>
                        <a href={t.targetLink}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800">
                          <ExternalLink className="w-3 h-3" /> {t.targetLabel || 'Buka'}
                        </a>
                        <button onClick={() => handleCompleteTask(t.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                          <CheckCircle className="w-3 h-3" /> Selesai
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Riwayat Laporan Bulanan */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b bg-blue-50 dark:bg-blue-900/20 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-700" />
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Riwayat Laporan Bulanan</h3>
          </div>
          {laporanHistory.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Belum ada laporan yang dikirim. <a href="/admin/operator/laporan-bulanan" className="text-blue-600 hover:underline font-medium">Kirim laporan →</a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Bulan</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Tahun</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Tanggal Kirim</th>
                    <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {laporanHistory.map((item) => {
                    const st = statusList.find(s => s.value === item.status) || statusList[0];
                    return (
                      <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-2.5 font-medium">{item.bulan || '-'}</td>
                        <td className="px-4 py-2.5 text-center">{item.tahun || '-'}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${st.className}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs text-muted-foreground">
                          {item.dikirimPada ? new Date(item.dikirimPada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <a href="/admin/operator/laporan-bulanan" className="text-blue-600 hover:underline text-xs font-medium">
                            Lihat
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
            Selamat datang, {user.displayName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Mengelola data: <strong>{user.schoolName || '-'}</strong>
          </p>
        </div>
      </main>
      <MobileBottomNav />
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}

