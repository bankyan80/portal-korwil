'use client';

import { DataTable } from '@/components/features/DataTable';
import { useSiswa } from '@/hooks/useSiswa';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 100;

const kelasOrderSD: Record<string, number> = { '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1 };
const kelasOrderTK: Record<string, number> = { '5': 5, '4': 4, '3': 3, '2': 2, '1': 1 };
const kelasOrderKB: Record<string, number> = { '3': 3, '2': 2, '1': 1 };

function sortSD(a: any, b: any) {
  const oa = kelasOrderSD[a.kelas] ?? 0;
  const ob = kelasOrderSD[b.kelas] ?? 0;
  return ob - oa;
}
function sortTK(a: any, b: any) {
  const oa = kelasOrderTK[a.kelas] ?? 0;
  const ob = kelasOrderTK[b.kelas] ?? 0;
  return ob - oa;
}
function sortKB(a: any, b: any) {
  const oa = kelasOrderKB[a.kelas] ?? 0;
  const ob = kelasOrderKB[b.kelas] ?? 0;
  return ob - oa;
}

const sdColumns = [
  { header: 'NIK', accessor: 'nik' as const },
  { header: 'Nama', accessor: 'nama' as const },
  { header: 'NISN', accessor: 'nisn' as const },
  { header: 'Kelas', accessor: 'kelas' as const },
  { header: 'Sekolah', accessor: 'sekolah' as const },
  { header: 'L/P', accessor: 'jk' as const },
  { header: 'Desa', accessor: 'desa' as const },
];

const tkColumns = [
  { header: 'NIK', accessor: 'nik' as const },
  { header: 'Nama', accessor: 'nama' as const },
  { header: 'NISN', accessor: 'nisn' as const },
  { header: 'Kelompok', accessor: 'kelas' as const },
  { header: 'Rombel', accessor: 'rombelLabel' as const },
  { header: 'Sekolah', accessor: 'sekolah' as const },
  { header: 'L/P', accessor: 'jk' as const },
  { header: 'Desa', accessor: 'desa' as const },
];

const kbColumns = [
  { header: 'NIK', accessor: 'nik' as const },
  { header: 'Nama', accessor: 'nama' as const },
  { header: 'NISN', accessor: 'nisn' as const },
  { header: 'Kelompok', accessor: 'kelas' as const },
  { header: 'Rombel', accessor: 'rombelLabel' as const },
  { header: 'Sekolah', accessor: 'sekolah' as const },
  { header: 'L/P', accessor: 'jk' as const },
  { header: 'Desa', accessor: 'desa' as const },
];

function withRombelLabel(items: any[]) {
  return items.map((d: any) => ({
    ...d,
    rombelLabel: d.rombel || '-',
  }));
}

function SiswaTable({ title, data, isLoading, error, columns, sortFn }: {
  title: string;
  data: any[] | null;
  isLoading: boolean;
  error: any;
  columns: any[];
  sortFn: (a: any, b: any) => number;
}) {
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort(sortFn);
  }, [data, sortFn]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-1">{title}</h2>
      <div className="text-xs text-muted-foreground mb-2">
        {sorted.length} siswa{totalPages > 1 ? ' - Halaman ' + page + '/' + totalPages : ''}
      </div>
      {isLoading && <div>Memuat data...</div>}
      {error && <div className="text-red-500">Gagal memuat data</div>}
      {data && <DataTable data={paginated} columns={columns} keyField="nik" />}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
        </div>
      )}
    </div>
  );
}

export default function SuperDataSiswa() {
  const { data: sdData, isLoading: sdLoading, error: sdError } = useSiswa('SD');
  const { data: tkData, isLoading: tkLoading, error: tkError } = useSiswa('TK');
  const { data: kbData, isLoading: kbLoading, error: kbError } = useSiswa('KB');

  const sdMapped = useMemo(() => sdData || [], [sdData]);
  const tkMapped = useMemo(() => withRombelLabel(tkData || []), [tkData]);
  const kbMapped = useMemo(() => withRombelLabel(kbData || []), [kbData]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data Siswa</h1>
      <p className="text-sm text-muted-foreground mb-6">Seluruh data peserta didik semua sekolah</p>

      <SiswaTable title="SD" data={sdMapped} isLoading={sdLoading} error={sdError} columns={sdColumns} sortFn={sortSD} />
      <SiswaTable title="TK" data={tkMapped} isLoading={tkLoading} error={tkError} columns={tkColumns} sortFn={sortTK} />
      <SiswaTable title="KB" data={kbMapped} isLoading={kbLoading} error={kbError} columns={kbColumns} sortFn={sortKB} />
    </div>
  );
}
