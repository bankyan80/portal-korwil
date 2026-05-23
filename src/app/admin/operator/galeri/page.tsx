'use client';

import { ManageGallery } from '@/components/admin/ManageGallery';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function GaleriPage() {
  return (
    <AdminLayout>
      <ManageGallery />
    </AdminLayout>
  );
}
