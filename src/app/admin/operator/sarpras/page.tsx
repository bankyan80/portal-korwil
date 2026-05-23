'use client';

import { ManageSarpras } from '@/components/admin/ManageSarpras';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function SarprasPage() {
  return (
    <SimpleAdminLayout>
      <ManageSarpras />
    </SimpleAdminLayout>
  );
}

