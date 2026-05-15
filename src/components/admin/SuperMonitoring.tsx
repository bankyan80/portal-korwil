'use client';

import { useAppStore } from '@/store/app-store';
import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import { ArrowLeft, Activity, Users, School, FileText, Loader2 } from 'lucide-react';

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/40', icon: 'text-blue-700 dark:text-blue-300' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: 'text-emerald-700 dark:text-emerald-300' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', icon: 'text-purple-700 dark:text-purple-300' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', icon: 'text-orange-700 dark:text-orange-300' },
};

export function SuperMonitoring() {
  const { user, setCurrentView } = useAppStore();

  const { data: users, loading: usersLoading } = useCachedFirestore({
    collectionName: 'users', enabled: !!user,
  });
  const { data: schools, loading: schoolsLoading } = useCachedFirestore({
    collectionName: 'schools', enabled: !!user,
  });
  const { data: students, loading: studentsLoading } = useCachedFirestore({
    collectionName: 'students', enabled: !!user,
  });
  const { data: reports, loading: reportsLoading } = useCachedFirestore({
    collectionName: 'reports', enabled: !!user,
  });
  const { data: employees, loading: employeesLoading } = useCachedFirestore({
    collectionName: 'employees', enabled: !!user,
  });

  const loading = usersLoading || schoolsLoading || studentsLoading || reportsLoading || employeesLoading;

  const stats = [
    { label: 'User Terdaftar', icon: Users, value: users.length, color: 'blue' },
    { label: 'Sekolah', icon: School, value: schools.length, color: 'emerald' },
    { label: 'Siswa', icon: Activity, value: students.length, color: 'purple' },
    { label: 'Guru/GTK', icon: Users, value: employees.length, color: 'orange' },
    { label: 'Laporan', icon: FileText, value: reports.length, color: 'blue' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('super-dashboard')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Monitoring</h1>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.map(s => {
            const c = colorMap[s.color];
            return (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${c.icon}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
