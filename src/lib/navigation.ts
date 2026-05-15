import type { AppView } from '@/types';
import type { Permission } from '@/lib/permissions';

export const ADMIN_PATH_MAP: Record<string, AppView> = {
  'manage-announcements': 'admin-manage-announcements',
  'manage-gallery': 'admin-manage-gallery',
  'manage-organizations': 'admin-manage-organizations',
  'manage-institution-links': 'admin-manage-institution-links',
  'manage-users': 'admin-manage-users',
  'backup-restore': 'admin-backup-restore',
  'tambah-pegawai': 'admin-tambah-pegawai',
  'verifikasi-konten': 'admin-verifikasi-konten',
  'laporan': 'admin-laporan',
  'super': 'super-dashboard',
  'super/users': 'super-users',
  'super/sekolah': 'super-schools',
  'super/organisasi': 'super-organizations',
  'super/laporan': 'super-reports',
  'super/monitoring': 'super-monitoring',
  'super/settings': 'super-settings',
  'super/update-data': 'super-update-data',
};

export function getViewFromPath(pathname: string): AppView {
  if (!pathname.startsWith('/admin')) return 'portal';
  const sub = pathname.substring('/admin'.length).replace(/^\//, '');
  if (!sub) return 'admin';
  return ADMIN_PATH_MAP[sub] || 'admin';
}

export function getPathFromView(view: string): string {
  const map: Record<string, string> = {
    portal: '/',
    admin: '/admin',
    'admin-manage-announcements': '/admin/manage-announcements',
    'admin-manage-gallery': '/admin/manage-gallery',
    'admin-manage-organizations': '/admin/manage-organizations',
    'admin-manage-institution-links': '/admin/manage-institution-links',
    'admin-manage-users': '/admin/manage-users',
    'admin-manage-documents': '/admin/manage-documents',
    'admin-backup-restore': '/admin/backup-restore',
    'admin-tambah-pegawai': '/admin/tambah-pegawai',
    'admin-manage-data-pd': '/admin/manage-data-pd',
    'admin-manage-laporan-bulanan': '/admin/manage-laporan-bulanan',
    'admin-manage-spmb-sd': '/admin/manage-spmb-sd',
    'admin-manage-kip-sd': '/admin/manage-kip-sd',
    'admin-manage-yatim-piatu': '/admin/manage-yatim-piatu',
    'admin-manage-agenda-kegiatan': '/admin/manage-agenda-kegiatan',
    'admin-manage-data-gtk': '/admin/manage-data-gtk',
    'admin-verifikasi-konten': '/admin/verifikasi-konten',
    'admin-laporan': '/admin/laporan',
    'super-dashboard': '/admin/super',
    'super-users': '/admin/super/users',
    'super-schools': '/admin/super/sekolah',
    'super-organizations': '/admin/super/organisasi',
    'super-reports': '/admin/super/laporan',
    'super-monitoring': '/admin/super/monitoring',
    'super-settings': '/admin/super/settings',
    'super-update-data': '/admin/super/update-data',
  };
  return map[view] || '/admin';
}

export const VIEW_PERMISSION_MAP: Record<string, Permission> = {
  'admin': 'view-admin',
  'admin-manage-announcements': 'manage-announcements',
  'admin-manage-gallery': 'manage-gallery',
  'admin-manage-organizations': 'manage-organizations',
  'admin-manage-institution-links': 'manage-institution-links',
  'admin-manage-users': 'manage-users',
  'admin-manage-documents': 'manage-documents',
  'admin-backup-restore': 'backup-restore',
  'admin-tambah-pegawai': 'add-employees',
  'admin-manage-data-pd': 'manage-data-pd',
  'admin-manage-laporan-bulanan': 'manage-laporan-bulanan',
  'admin-manage-spmb-sd': 'manage-spmb-sd',
  'admin-manage-kip-sd': 'manage-kip-sd',
  'admin-manage-yatim-piatu': 'manage-yatim-piatu',
  'admin-manage-agenda-kegiatan': 'manage-agenda-kegiatan',
  'admin-manage-data-gtk': 'manage-data-gtk',
  'admin-verifikasi-konten': 'manage-content-verification',
  'admin-laporan': 'view-reports',
  'super-dashboard': 'view-admin',
  'super-users': 'manage-users',
  'super-schools': 'manage-schools',
  'super-organizations': 'manage-organizations',
  'super-reports': 'view-reports',
  'super-monitoring': 'manage-monitoring',
  'super-settings': 'manage-settings',
  'super-update-data': 'manage-schools',
};

export const VIEW_TITLES: Record<string, string> = {
  admin: 'Dashboard',
  'admin-manage-announcements': 'Kelola Informasi',
  'admin-manage-gallery': 'Kelola Galeri',
  'admin-manage-organizations': 'Kelola Organisasi',
  'admin-manage-institution-links': 'Kelola Link Instansi',
  'admin-manage-users': 'Kelola User',
  'admin-manage-documents': 'Input Dokumen',
  'admin-backup-restore': 'Backup & Restore Database',
  'admin-tambah-pegawai': 'Tambah Pegawai',
  'admin-manage-data-pd': 'Data Peserta Didik',
  'admin-manage-laporan-bulanan': 'Laporan Bulanan',
  'admin-manage-spmb-sd': 'SPMB SD',
  'admin-manage-kip-sd': 'KIP SD',
  'admin-manage-yatim-piatu': 'Yatim Piatu',
  'admin-manage-agenda-kegiatan': 'Agenda Kegiatan',
  'super-dashboard': 'Super Dashboard',
  'super-schools': 'Data Sekolah',
  'super-monitoring': 'Monitoring',
  'super-settings': 'Pengaturan Portal',
  'super-update-data': 'Update Data',
};
