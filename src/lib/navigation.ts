import type { AppView } from '@/types';
import type { Permission } from '@/lib/permissions';

export const ADMIN_PATH_MAP: Record<string, AppView> = {
  'operator/data-siswa': 'admin-manage-data-pd',
  'super/data-siswa': 'admin-manage-data-pd',
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
    'admin-manage-data-pd': '/admin/operator/data-siswa',
  };
  return map[view] || '/admin';
}

export const VIEW_PERMISSION_MAP: Record<string, Permission> = {
  'admin': 'view-admin',
  'admin-manage-data-pd': 'manage-data-pd',
};

export const VIEW_TITLES: Record<string, string> = {
  admin: 'Dashboard',
  'admin-manage-data-pd': 'Edit Data Siswa',
};
