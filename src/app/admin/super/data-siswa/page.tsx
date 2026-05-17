'use client';

import { QueryProvider } from '@/contexts/QueryProvider';
import SuperDataSiswa from '@/components/admin/SuperDataSiswa';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperDataSiswaPage() {
  return (
    <SuperPageShell title="Data Siswa" subtitle="Seluruh data peserta didik semua sekolah">
      <QueryProvider>
        <SuperDataSiswa />
      </QueryProvider>
    </SuperPageShell>
  );
}
