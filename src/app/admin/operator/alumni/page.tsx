'use client';

import { ManageAlumni } from '@/components/admin/ManageAlumni';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AlumniPage() {
  return (
    <AuthGuard requiredRoles={['operator']} requireActive featureName="Alumni">
    <SimpleAdminLayout>
      <ManageAlumni />
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
