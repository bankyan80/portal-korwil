'use client';

import { ManageLaporanBulanan } from '@/components/admin/ManageLaporanBulanan';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperLaporanBulananPage() {
  return (
    <SuperPageShell title="Laporan Bulanan" subtitle="Monitoring laporan bulanan semua sekolah">
      <ManageLaporanBulanan />
    </SuperPageShell>
  );
}
