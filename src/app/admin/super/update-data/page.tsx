'use client';

import { UpdateDataSiswaPegawai } from '@/components/admin/UpdateDataSiswaPegawai';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperUpdateDataPage() {
  return (
    <SuperPageShell title="Update Data" subtitle="Import data siswa & pegawai dari CSV/Excel">
      <UpdateDataSiswaPegawai />
    </SuperPageShell>
  );
}
