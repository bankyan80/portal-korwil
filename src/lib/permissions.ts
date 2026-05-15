import type { UserRole, AppView } from '@/types';
import type { LucideIcon } from 'lucide-react';

export type Permission =
  | 'view-admin'
  | 'manage-announcements'
  | 'manage-gallery'
  | 'manage-organizations'
  | 'manage-institution-links'
  | 'manage-users'
  | 'manage-documents'
  | 'backup-restore'
  | 'add-employees'
  | 'manage-data-pd'
  | 'manage-laporan-bulanan'
  | 'manage-spmb-sd'
  | 'manage-kip-sd'
  | 'manage-yatim-piatu'
  | 'manage-agenda-kegiatan'
  | 'manage-data-gtk'
  | 'manage-content-verification'
  | 'view-reports'
  | 'manage-schools'
  | 'manage-settings'
  | 'manage-monitoring'
  | 'manage-news'
  | 'manage-class-recap'
  | 'manage-calendar'
  | 'manage-dokumen-bersama';

const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    'view-admin',
    'manage-announcements',
    'manage-gallery',
    'manage-organizations',
    'manage-institution-links',
    'manage-users',
    'manage-documents',
    'backup-restore',
    'add-employees',
    'manage-data-pd',
    'manage-laporan-bulanan',
    'manage-spmb-sd',
    'manage-kip-sd',
    'manage-yatim-piatu',
    'manage-dokumen-bersama',
    'manage-agenda-kegiatan',
    'manage-data-gtk',
    'manage-content-verification',
    'view-reports',
    'manage-schools',
    'manage-settings',
    'manage-monitoring',
    'manage-news',
    'manage-class-recap',
    'manage-calendar',
  ],
  operator_sekolah: [
    'view-admin',
    'manage-gallery',
    'manage-data-pd',
    'manage-laporan-bulanan',
    'manage-spmb-sd',
    'manage-kip-sd',
    'manage-yatim-piatu',
    'manage-documents',
    'manage-data-gtk',
    'manage-news',
    'manage-class-recap',
  ],
  ketua_organisasi: [
    'view-admin',
    'manage-announcements',
    'manage-gallery',
    'manage-organizations',
    'manage-users',
    'manage-agenda-kegiatan',
    'manage-content-verification',
    'view-reports',
    'manage-news',
    'manage-calendar',
  ],
  publik: [],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canAccessAdmin(role: UserRole | undefined): boolean {
  return hasPermission(role, 'view-admin');
}

export interface NavItemPerm {
  label: string;
  icon: LucideIcon;
  view: AppView;
  permission: Permission;
}

export function filterNavItems(items: NavItemPerm[], role: UserRole | undefined): NavItemPerm[] {
  return items.filter((item) => hasPermission(role, item.permission));
}

export function getAdminDashboardRoute(role: UserRole | undefined): string {
  switch (role) {
    case 'super_admin': return '/admin/super';
    case 'ketua_organisasi': return '/admin/organisasi';
    case 'operator_sekolah': return '/admin/operator';
    default: return '/login';
  }
}
