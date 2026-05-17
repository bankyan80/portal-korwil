'use client';

import { DataTable } from '@/components/features/DataTable';
import { useSiswa } from '@/hooks/useSiswa';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 100;

const columns = [
  { header: 'NIK', accessor: 'nik' as const },
  { header: 'Nama', accessor: 'nama' as const },
  { header: 'NISN', accessor: 'nisn' as const },
  { header: 'Jenjang', accessor: 'jenjang' as const },
  { header: 'Kelas', accessor: 'kelas' as const },
  { header: 'Sekolah', accessor: 'sekolah' as const },
  { header: 'L/P', accessor: 'jk' as const },
  { header: 'Desa', accessor: 'desa' as const },
];

const kelasOrder: Record<string, number> = {
  '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1,
  'TK B': 8, 'TK A': 7,
  'KB B': 10, 'KB A': 9,
};

function sortByKelasDesc(a: any, b: any) {
  if (a.jenjang !== b.jenjang) return a.jenjang?.localeCompare(b.jenjang || '') || 0;
  const oa = kelasOrder[a.kelas] ?? 0;
  const ob = kelasOrder[b.kelas] ?? 0;
  return ob - oa;
}

export default function SuperDataSiswa() {
  const [jenjang, setJenjang] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useSiswa(jenjang);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data].sort(sortByKelasDesc);
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Data Siswa</h1>
      <p className="text-sm text-muted-foreground mb-4">Seluruh data peserta didik semua sekolah</p>
      <div className="flex gap-2 mb-4">
        <Button variant={!jenjang ? 'default' : 'outline'} onClick={() => { setJenjang(undefined); setPage(1); }}>Semua</Button>
        <Button variant={jenjang === 'SD' ? 'default' : 'outline'} onClick={() => { setJenjang('SD'); setPage(1); }}>SD</Button>
        <Button variant={jenjang === 'TK' ? 'default' : 'outline'} onClick={() => { setJenjang('TK'); setPage(1); }}>TK</Button>
        <Button variant={jenjang === 'KB' ? 'default' : 'outline'} onClick={() => { setJenjang('KB'); setPage(1); }}>KB</Button>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        {sorted.length} siswa{totalPages > 1 ? ` • Halaman ${page}/${totalPages}` : ''}
      </div>
      {isLoading && <div>Memuat data...</div>}
      {error && <div className="text-red-500">Gagal memuat data</div>}
      {data && <DataTable data={paginated} columns={columns} keyField="nik" />}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
        </div>
      )}
    </div>
  );
}
