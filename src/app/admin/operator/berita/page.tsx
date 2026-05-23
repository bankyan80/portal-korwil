'use client';

import { ManageBerita } from '@/components/admin/ManageBerita';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function BeritaPage() {
  return (
    <SimpleAdminLayout>
      <ManageBerita />
    </SimpleAdminLayout>
  );
}

