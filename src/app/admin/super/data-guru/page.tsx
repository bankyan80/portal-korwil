'use client';

import { QueryProvider } from '@/contexts/QueryProvider';
import SuperDataGuru from '@/components/admin/SuperDataGuru';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperDataGuruPage() {
  return (
    <SuperPageShell title="Data GTK" subtitle="Seluruh data pendidik dan tenaga kependidikan">
      <QueryProvider>
        <SuperDataGuru />
      </QueryProvider>
    </SuperPageShell>
  );
}
