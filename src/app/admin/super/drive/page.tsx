'use client';

import SuperPageShell from '@/components/admin/SuperPageShell';
import { SuperDriveMapping } from '@/components/admin/SuperDriveMapping';

export default function SuperDrivePage() {
  return (
    <SuperPageShell title="Folder Drive Sekolah" subtitle="Atur mapping folder Google Drive per sekolah">
      <SuperDriveMapping />
    </SuperPageShell>
  );
}
