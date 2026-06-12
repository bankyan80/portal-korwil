import type { UserRole } from '@/types';

export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'super_admin': return '/admin/super';
    case 'operator_sekolah': return '/admin/operator';
    default: return '/';
  }
}

export function getRoleLabel(role: UserRole | undefined): string {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'operator_sekolah': return 'Operator Sekolah';
    case 'publik': return 'Publik';
    default: return '-';
  }
}
