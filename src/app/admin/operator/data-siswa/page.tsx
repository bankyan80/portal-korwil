'use client';

import { DataTable } from '@/components/features/DataTable';
import { useSiswa } from '@/hooks/useSiswa';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QueryProvider } from '@/contexts/QueryProvider';

export const dynamic = 'force-dynamic';

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

function SiswaContent() {
  const [jenjang, setJenjang] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useSiswa(jenjang);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data Siswa (V2 - Sesuai Data Asli)</h1>
      <div className="flex gap-2 mb-4">
        <Button variant={!jenjang ? 'default' : 'outline'} onClick={() => setJenjang(undefined)}>Semua</Button>
        <Button variant={jenjang === 'SD' ? 'default' : 'outline'} onClick={() => setJenjang('SD')}>SD</Button>
        <Button variant={jenjang === 'TK' ? 'default' : 'outline'} onClick={() => setJenjang('TK')}>TK</Button>
        <Button variant={jenjang === 'KB' ? 'default' : 'outline'} onClick={() => setJenjang('KB')}>KB</Button>
      </div>
      {isLoading && <div>Memuat data...</div>}
      {error && <div className="text-red-500">Gagal memuat data</div>}
      {data && <DataTable data={data} columns={columns} keyField="nik" />}
    </div>
  );
}

export default function DataSiswaV2Page() {
  return (
    <QueryProvider>
      <SiswaContent />
    </QueryProvider>
  );
}
