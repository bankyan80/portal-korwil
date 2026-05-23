'use client';

import { useAppStore } from '@/store/app-store';
import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import { ArrowLeft, Activity, Users, School, FileText, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMemo } from 'react';

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', icon: 'text-blue-700 dark:text-blue-300' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'text-emerald-700 dark:text-emerald-300' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', icon: 'text-purple-700 dark:text-purple-300' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', icon: 'text-orange-700 dark:text-orange-300' },
  red: { bg: 'bg-red-100 dark:bg-red-900/40', icon: 'text-red-700 dark:text-red-300' },
};

export function SuperMonitoring() {
  const { user, setCurrentView } = useAppStore();

  const { data: users, loading: usersLoading } = useCachedFirestore({
    collectionName: 'users', realtime: false, enabled: !!user,
  });
  const { data: schools, loading: schoolsLoading } = useCachedFirestore<any>({
    collectionName: 'schools', realtime: false, enabled: !!user,
  });
  const { data: students, loading: studentsLoading } = useCachedFirestore<any>({
    collectionName: 'students', realtime: false, ttl: 120_000, enabled: !!user,
  });
  const { data: reports, loading: reportsLoading } = useCachedFirestore({
    collectionName: 'reports', realtime: false, enabled: !!user,
  });
  const { data: employees, loading: employeesLoading } = useCachedFirestore<any>({
    collectionName: 'employees', realtime: false, ttl: 120_000, enabled: !!user,
  });

  const loading = usersLoading || schoolsLoading || studentsLoading || reportsLoading || employeesLoading;

  const schoolsWithoutStudents = useMemo(() => {
    if (loading) return [];
    return schools.filter(school => {
      const studentCount = students.filter(s => s.schoolId === school.id || s.sekolah === school.name).length;
      return studentCount === 0;
    });
  }, [schools, students, loading]);

  const stats = [
    { label: 'User Terdaftar', icon: Users, value: users.length, color: 'blue' },
    { label: 'Sekolah', icon: School, value: schools.length, color: 'emerald' },
    { label: 'Siswa', icon: Activity, value: students.length, color: 'purple' },
    { label: 'Guru/GTK', icon: Users, value: employees.length, color: 'orange' },
    { label: 'Sekolah Kosong', icon: AlertTriangle, value: schoolsWithoutStudents.length, color: 'red' },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('super-dashboard')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Monitoring Sistem</h1>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map(s => {
              const c = colorMap[s.color];
              return (
                <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                      <s.icon className={`w-5 h-5 ${c.icon}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">{s.value}</p>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">{s.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="font-bold text-gray-900 dark:text-white">Sekolah Belum Ada Siswa</h2>
              </div>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {schoolsWithoutStudents.length} Sekolah
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left border-b dark:border-gray-700">
                    <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Nama Sekolah</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">NPSN</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Jenjang</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {schoolsWithoutStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground italic">
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-green-500 opacity-20" />
                          <p>Semua sekolah sudah memiliki data siswa.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    schoolsWithoutStudents.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white uppercase">{s.name}</td>
                        <td className="px-5 py-3 text-gray-500 font-mono text-xs">{s.npsn || s.id}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-[10px] font-bold">
                            {s.jenjang || 'SD'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-medium">
                            Data Kosong
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
