'use client';

import { ManageDataPd } from '@/components/admin/ManageDataPd';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';
import AuthGuard from '@/components/auth/AuthGuard';

export default function DataSiswaPage() {
  return (
    <AuthGuard requiredRoles={['operator']} requireActive featureName="Data Siswa">
    <SimpleAdminLayout>
      <ManageDataPd />
    </SimpleAdminLayout>
    </AuthGuard>
  );
}

