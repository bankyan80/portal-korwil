'use client';

import { ManageGallery } from '@/components/admin/ManageGallery';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperGaleriPage() {
  return (
    <SuperPageShell title="Kelola Galeri" subtitle="Atur galeri foto semua kategori">
      <ManageGallery />
    </SuperPageShell>
  );
}
