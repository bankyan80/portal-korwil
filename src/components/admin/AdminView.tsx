'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { hasPermission } from '@/lib/permissions';
import { VIEW_PERMISSION_MAP } from '@/lib/navigation';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { ManageAnnouncements } from './ManageAnnouncements';
import { ManageGallery } from './ManageGallery';
import { ManageOrganizations } from './ManageOrganizations';
import { ManageInstitutionLinks } from './ManageInstitutionLinks';
import { ManageUsers } from './ManageUsers';
import InputDokumen from './InputDokumen';
import BackupRestore from './BackupRestore';
import TambahPegawai from './TambahPegawai';
import { ManageDataPd } from './ManageDataPd';
import { ManageLaporanBulanan } from './ManageLaporanBulanan';
import { ManageSpmbSd } from './ManageSpmbSd';
import { ManageKipSd } from './ManageKipSd';
import { ManageYatimPiatu } from './ManageYatimPiatu';
import { ManageAgendaKegiatan } from './ManageAgendaKegiatan';
import { ManageDataGtk } from './ManageDataGtk';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { SuperSekolah } from './SuperSekolah';
import { SuperMonitoring } from './SuperMonitoring';
import { SuperSettings } from './SuperSettings';
import { UpdateDataSiswaPegawai } from './UpdateDataSiswaPegawai';

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
    case 'admin-manage-announcements': return <ManageAnnouncements />;
    case 'admin-manage-gallery': return <ManageGallery />;
    case 'admin-manage-organizations': return <ManageOrganizations />;
    case 'admin-manage-institution-links': return <ManageInstitutionLinks />;
    case 'admin-manage-users': return <ManageUsers />;
    case 'admin-manage-documents': return <InputDokumen />;
    case 'admin-backup-restore': return <BackupRestore />;
    case 'admin-tambah-pegawai': return <TambahPegawai />;
    case 'admin-manage-data-pd': return <ManageDataPd />;
    case 'admin-manage-laporan-bulanan': return <ManageLaporanBulanan />;
    case 'admin-manage-spmb-sd': return <ManageSpmbSd />;
    case 'admin-manage-kip-sd': return <ManageKipSd />;
    case 'admin-manage-yatim-piatu': return <ManageYatimPiatu />;
    case 'admin-manage-agenda-kegiatan': return <ManageAgendaKegiatan />;
    case 'admin-manage-data-gtk': return <ManageDataGtk />;
    case 'super-dashboard': return <SuperAdminDashboard />;
    case 'super-schools': return <SuperSekolah />;
    case 'super-monitoring': return <SuperMonitoring />;
    case 'super-settings': return <SuperSettings />;
    case 'super-users': return <ManageUsers />;
    case 'super-organizations': return <ManageOrganizations />;
    case 'super-reports': return <ManageLaporanBulanan />;
    case 'super-update-data': return <UpdateDataSiswaPegawai />;
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
