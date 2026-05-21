'use client';

import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import SuperPageShell from '@/components/admin/SuperPageShell';
import { Users, School, GraduationCap, FileText, Loader2, UserCheck } from 'lucide-react';

export default function SuperMonitoringPage() {
  const { data: users } = useCachedFirestore<{ id: string }>({
    collectionName: 'users', realtime: true, enabled: true,
  });
  const { data: schools } = useCachedFirestore<{ id: string }>({
    collectionName: 'schools', realtime: true, enabled: true,
  });
  const { data: students } = useCachedFirestore<Record<string, any>>({
    collectionName: 'students', realtime: true, enabled: true,
  });
  const { data: reports } = useCachedFirestore<{ id: string }>({
    collectionName: 'reports', realtime: true, enabled: true,
  });
  const { data: employees } = useCachedFirestore<Record<string, any>>({
    collectionName: 'employees', realtime: true, enabled: true,
  });

  const loading = !users.length && !schools.length && !students.length && !reports.length && !employees.length;

  const stats = [
    { label: 'Total User', value: users.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Sekolah', value: schools.length, icon: School, color: 'bg-green-500' },
    { label: 'Siswa', value: students.length, icon: GraduationCap, color: 'bg-purple-500' },
    { label: 'Pegawai', value: employees.length, icon: UserCheck, color: 'bg-orange-500' },
    { label: 'Laporan', value: reports.length, icon: FileText, color: 'bg-rose-500' },
  ];

  return (
    <SuperPageShell title="Monitoring" subtitle="Realtime statistik seluruh data">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${s.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${s.color.replace('bg-', 'text-')}`} />
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
    </SuperPageShell>
  );
}
