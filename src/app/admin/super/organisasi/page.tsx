'use client';

import { ManageOrganizations } from '@/components/admin/ManageOrganizations';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperOrganisasiPage() {
  return (
    <SuperPageShell title="Kelola Organisasi" subtitle="Atur data organisasi & kepengurusan">
      <ManageOrganizations />
    </SuperPageShell>
  );
}
