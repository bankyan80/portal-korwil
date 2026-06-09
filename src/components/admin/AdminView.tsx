'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { hasPermission } from '@/lib/permissions';
import { VIEW_PERMISSION_MAP } from '@/lib/navigation';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { ManageDataPd } from './ManageDataPd';
import { ManageAlumni } from './ManageAlumni';

function AdminContent() {
  const { currentView, user, setCurrentView } = useAppStore();

  const requiredPermission = VIEW_PERMISSION_MAP[currentView];

  useEffect(() => {
    if (requiredPermission && !hasPermission(user?.role, requiredPermission)) {
      setCurrentView('admin');
    }
  }, [currentView, user?.role, requiredPermission, setCurrentView]);

  switch (currentView) {
    case 'admin': return <AdminDashboard />;
    case 'admin-manage-data-pd': return <ManageDataPd />;
    case 'admin-alumni': return <ManageAlumni />;
    default: return <AdminDashboard />;
  }
}

export default function AdminView() {
  const { user, isLoadingAuth } = useAppStore();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Memuat...</span>
        </div>
      </div>
    );
  }

  if (!user || !hasPermission(user?.role, 'view-admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Akses Ditolak</h2>
          <p className="text-muted-foreground mt-2">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <AdminContent />
    </AdminLayout>
  );
}
