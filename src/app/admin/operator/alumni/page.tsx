'use client';

import { ManageAlumni } from '@/components/admin/ManageAlumni';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function AlumniPage() {
  return (
    <SimpleAdminLayout>
      <ManageAlumni />
    </SimpleAdminLayout>
  );
}
