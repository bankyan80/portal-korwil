'use client';

import { useAppStore } from '@/store/app-store';
import { useCachedFirestore } from '@/hooks/useCachedFirestore';
import { Users, School, Building2, FileText, Activity, Loader2, RefreshCw } from 'lucide-react';

const viewMap: Record<string, string> = {
  'super-users': 'super-users',
  'super-schools': 'super-schools',
  'super-organizations': 'super-organizations',
  'super-reports': 'super-reports',
  'super-monitoring': 'super-monitoring',
  'super-settings': 'super-settings',
};

export function SuperAdminDashboard() {
  const { user, setCurrentView } = useAppStore();

  const { data: users } = useCachedFirestore<{ id: string }>({
    collectionName: 'users', realtime: false,
    enabled: !!user,
  });
  const { data: schools, loading: schoolsLoading } = useCachedFirestore<{ id: string }>({
    collectionName: 'schools', realtime: false,
    enabled: !!user,
  });
  const { data: orgs, loading: orgsLoading } = useCachedFirestore<{ id: string }>({
    collectionName: 'organizations', realtime: false,
    enabled: !!user,
  });
  const { data: reports, loading: reportsLoading } = useCachedFirestore<{ id: string }>({
    collectionName: 'reports', realtime: false,
    enabled: !!user,
  });

  const loading = schoolsLoading || orgsLoading || reportsLoading;

  const menu = [
    { label: 'Data User', icon: Users, count: users.length, view: 'super-users' },
    { label: 'Data Sekolah', icon: School, count: schools.length, view: 'super-schools' },
    { label: 'Organisasi', icon: Building2, count: orgs.length, view: 'super-organizations' },
    { label: 'Laporan', icon: FileText, count: reports.length, view: 'super-reports' },
    { label: 'Monitoring', icon: Activity, count: null, view: 'super-monitoring' },
    { label: 'Pengaturan', icon: Activity, count: null, view: 'super-settings' },
    { label: 'Update Data', icon: RefreshCw, count: null, view: 'super-update-data' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard Super Admin</h1>
        <p className="text-sm text-muted-foreground">{user?.displayName} &bull; {user?.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {menu.map((item) => (
          <button key={item.label} onClick={() => setCurrentView(item.view as any)}
            className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 hover:shadow-md transition-shadow text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                {item.count !== null && (
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : item.count}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Aktivitas Terkini</h2>
        <p className="text-sm text-muted-foreground">Fitur monitoring aktivitas akan tersedia di sini.</p>
      </div>
    </div>
  );
}
