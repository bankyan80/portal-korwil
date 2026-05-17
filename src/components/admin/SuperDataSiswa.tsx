'use client';

import { DataTable } from '@/components/features/DataTable';
import { useSiswa } from '@/hooks/useSiswa';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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

export default function SuperDataSiswa() {
  const [jenjang, setJenjang] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useSiswa(jenjang);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Data Siswa</h1>
      <p className="text-sm text-muted-foreground mb-4">Seluruh data peserta didik semua sekolah</p>
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
