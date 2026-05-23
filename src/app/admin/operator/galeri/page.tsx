'use client';

import { ManageGallery } from '@/components/admin/ManageGallery';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function GaleriPage() {
  return (
    <SimpleAdminLayout>
      <ManageGallery />
    </SimpleAdminLayout>
  );
}

