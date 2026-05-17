'use client';

import { QueryProvider } from '@/contexts/QueryProvider';
import SuperDataGuru from '@/components/admin/SuperDataGuru';

export default function SuperDataGuruPage() {
  return (
    <QueryProvider>
      <SuperDataGuru />
    </QueryProvider>
  );
}
