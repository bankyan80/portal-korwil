'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import { normalizeSchool } from '@/lib/normalize';
import { Users, School, BarChart3, FileText, Image, Megaphone, LogOut, Loader2, Building2 } from 'lucide-react';

export default function OperatorDashboard() {
  const { user, setUser } = useAppStore();
  const router = useRouter();

  const { data: allStudents } = useCachedFirestore<Record<string, any>>({
    collectionName: 'students',
    realtime: false,
    enabled: !!user?.schoolName,
  });
  const { data: allEmployees } = useCachedFirestore<Record<string, any>>({
    collectionName: 'employees',
    realtime: false,
    enabled: !!user?.schoolName,
  });

  const calculateCounts = (
    students: Record<string, any>[],
    employees: Record<string, any>[],
    schoolName: string | undefined,
    schoolId: string | undefined
  ) => {
    if (!schoolName && !schoolId) return { sCount: 0, eCount: 0 };
    const normalized = normalizeSchool(schoolName || '');
    let sCount = 0;
    let eCount = 0;
    for (const d of students) {
      if (d.schoolId === schoolId || normalizeSchool(d.sekolah || d.schoolName || '') === normalized) {
        sCount++;
      }
    }
    for (const d of employees) {
      if (d.schoolId === schoolId || normalizeSchool(d.sekolah || d.schoolName || '') === normalized) {
        eCount++;
      }
    }
    return { sCount, eCount };
  };

  const calculatedCounts = useMemo(() => {
    return calculateCounts(
      allStudents,
      allEmployees,
      user?.schoolName,
      user?.schoolId
    );
  }, [allStudents, allEmployees, user?.schoolName, user?.schoolId]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'operator_sekolah') router.push('/login');
  }, [user, router]);

  if (!user) return null;

  function handleLogout() {
    if (auth) auth.signOut();
    setUser(null);
    router.push('/');
  }

  const menu = [
    { label: 'Profil Sekolah', icon: School, desc: 'Kelola data sekolah', count: null, href: '/admin/operator/profil-sekolah' },
    { label: 'Data Guru', icon: Users, desc: 'Kelola data pendidik dan tenaga kependidikan', count: calculatedCounts.eCount, href: '/admin/operator/data-guru' },
    { label: 'Data Siswa', icon: Users, desc: 'Kelola data peserta didik', count: calculatedCounts.sCount, href: '/admin/operator/data-siswa' },
    { label: 'Rekap Kelas', icon: BarChart3, desc: 'Rekapitulasi kelas otomatis', count: null, href: '/admin/operator/rekap-kelas' },
    { label: 'SPMB', icon: FileText, desc: 'Penerimaan peserta didik baru', count: null, href: '/admin/operator/spmb' },
    { label: 'Upload Berita', icon: Megaphone, desc: 'Kirim berita sekolah', count: null, href: '/admin/operator/berita' },
    { label: 'Upload Galeri', icon: Image, desc: 'Dokumentasi kegiatan sekolah', count: null, href: '/admin/operator/galeri' },
    { label: 'Sarpras', icon: Building2, desc: 'Data sarana dan prasarana sekolah', count: null, href: '/admin/operator/sarpras' },
    { label: 'Lapor Bulanan', icon: FileText, desc: 'Cetak & kirim laporan bulanan sekolah', count: null, href: '/admin/operator/laporan-bulanan' },
  ];

  const isStatsLoading = !allStudents || !allEmployees;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Dashboard Operator Sekolah</h1>
          <p className="text-sm text-blue-200">{user.displayName} • {user.schoolName || 'Sekolah'}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

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

        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">
            Selamat datang, {user.displayName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Mengelola data: <strong>{user.schoolName || '-'}</strong>
          </p>
        </div>
      </main>
    </div>
  );
}