'use client';

import { QueryProvider } from '@/contexts/QueryProvider';
import SuperDataSiswa from '@/components/admin/SuperDataSiswa';

export default function SuperDataSiswaPage() {
  return (
    <QueryProvider>
      <SuperDataSiswa />
    </QueryProvider>
  );
}
