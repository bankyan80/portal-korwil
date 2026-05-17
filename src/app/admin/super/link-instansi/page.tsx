'use client';

import { ManageInstitutionLinks } from '@/components/admin/ManageInstitutionLinks';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperLinkInstansiPage() {
  return (
    <SuperPageShell title="Link Instansi Terkait" subtitle="Atur tautan instansi terkait yang tampil di portal">
      <ManageInstitutionLinks />
    </SuperPageShell>
  );
}
