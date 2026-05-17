'use client';

import { DataTable } from '@/components/features/DataTable';
import { usePegawai } from '@/hooks/usePegawai';
import { QueryProvider } from '@/contexts/QueryProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

const columns = [
  { header: 'Nama', accessor: 'nama' as const },
  { header: 'NUPTK', accessor: 'nuptk' as const },
  { header: 'Status', accessor: 'status_kepegawaian' as const },
  { header: 'Sekolah', accessor: 'sekolah' as const },
];

function GtkContent() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading, error } = usePegawai(1, search);

  const handleSearch = () => setSearch(searchInput);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Data GTK (Guru & Tenaga Kependidikan)</h1>
      
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Cari nama atau NUPTK..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch}>Cari</Button>
        {search && (
          <Button variant="outline" onClick={() => { setSearch(''); setSearchInput(''); }}>
            Reset
          </Button>
        )}
      </div>

      {isLoading && <div>Memuat data...</div>}
      {error && <div className="text-red-500">Gagal memuat data</div>}
      {data && <DataTable data={data.items || []} columns={columns} keyField="nuptk" />}
    </div>
  );
}

export default function DataGtkPublicPage() {
  return (
    <QueryProvider>
      <GtkContent />
    </QueryProvider>
  );
}
