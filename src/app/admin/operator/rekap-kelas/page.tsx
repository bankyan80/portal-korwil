'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import { normalizeSchool } from '@/lib/normalize';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';

interface KelasRecap {
  kelas: string;
  l: number;
  p: number;
  total: number;
}

const kelasList = ['KB A', 'KB B', 'TK A', 'TK B', '1', '2', '3', '4', '5', '6'];

export default function RekapKelasPage() {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'operator_sekolah') router.push('/login');
  }, [user, router]);

  const { data: allStudents, loading } = useCachedFirestore<Record<string, any>>({
    collectionName: 'students',
    enabled: !!user?.schoolName,
  });

  const recap = useMemo<KelasRecap[]>(() => {
    if (!user?.schoolName && !user?.schoolId) return [];
    const normalized = normalizeSchool(user?.schoolName || '');

    const filtered = allStudents.filter(s => {
      if (s.schoolId && s.schoolId === user?.schoolId) return true;
      return normalizeSchool(s.sekolah || s.schoolName || '') === normalized;
    }).filter(s => s.status !== 'lulus');

    const map = new Map<string, { l: number; p: number }>();
    kelasList.forEach(k => map.set(k, { l: 0, p: 0 }));

    for (const s of filtered) {
      const k = s.kelas ? String(s.kelas) : '-';
      const kelasStr = s.jenjang === 'SD' ? k : `${s.jenjang || 'KB'} ${k}`;
      const entry = map.get(kelasStr) || map.get('-') || { l: 0, p: 0 };
      if (s.jenisKelamin === 'L' || s.jk === 'L') entry.l++;
      else entry.p++;
    }

    return Array.from(map.entries()).map(([kelas, v]) => ({
      kelas, l: v.l, p: v.p, total: v.l + v.p,
    }));
  }, [allStudents, user?.schoolName, user?.schoolId]);

  const totals = useMemo(() =>
    recap.reduce((a, r) => ({ l: a.l + r.l, p: a.p + r.p, total: a.total + r.total }), { l: 0, p: 0, total: 0 }),
    [recap],
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/operator')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Rekap Kelas</h1>
            <p className="text-sm text-muted-foreground">{user?.schoolName || 'Sekolah'}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totals.l}</p>
                <p className="text-xs text-muted-foreground">Laki-laki</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{totals.p}</p>
                <p className="text-xs text-muted-foreground">Perempuan</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totals.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">L</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">P</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recap.filter(r => r.total > 0).map(r => (
                    <tr key={r.kelas} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-foreground">{r.kelas}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{r.l}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{r.p}</td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-semibold">
                  <tr>
                    <td className="px-4 py-3 text-foreground">Total</td>
                    <td className="px-4 py-3 text-center text-foreground">{totals.l}</td>
                    <td className="px-4 py-3 text-center text-foreground">{totals.p}</td>
                    <td className="px-4 py-3 text-center text-foreground">{totals.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">Rekap otomatis dari data siswa. Data diperbarui secara realtime.</p>
          </>
        )}
      </div>
    </div>
  );
}
