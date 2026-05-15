export type UserRole = 'super_admin' | 'ketua_organisasi' | 'operator_sekolah' | 'publik';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  schoolId?: string;
  schoolName?: string;
  jabatan?: string;
  organizationId?: string;
  organization?: string;
  phone?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastLogin?: number;
}
