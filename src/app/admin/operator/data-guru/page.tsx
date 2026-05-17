'use client';

import { DataTable } from '@/components/features/DataTable';
import { usePegawai } from '@/hooks/usePegawai';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryProvider } from '@/contexts/QueryProvider';

export const dynamic = 'force-dynamic';

const columns = [
  { header: 'Nama', accessor: 'nama' as const },
  { header: 'NIP', accessor: 'nip' as const },
  { header: 'NUPTK', accessor: 'nuptk' as const },
  { header: 'Status', accessor: 'status_kepegawaian' as const },
  { header: 'Sekolah', accessor: 'sekolah' as const },
  { header: 'Tgl Lahir', accessor: 'tanggal_lahir' as const },
];

function GuruContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading, error } = usePegawai(page, search);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data GTK (V2 - Guru & Tendik)</h1>
      
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Cari nama, NIP, NUPTK..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch}>Cari</Button>
        {search && (
          <Button variant="outline" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
            Reset
          </Button>
        )}
      </div>

      {isLoading && <div>Memuat data...</div>}
      {error && <div className="text-red-500">Gagal memuat data</div>}
      
      {data && (
        <>
          <DataTable data={data.items || []} columns={columns} keyField="nip" />
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Halaman {data.page} dari {data.totalPages} (Total: {data.total})
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DataGuruV2Page() {
  return (
    <QueryProvider>
      <GuruContent />
    </QueryProvider>
  );
}
