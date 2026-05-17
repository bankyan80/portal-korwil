'use client';

import { DataTable } from '@/components/features/DataTable';
import { QueryProvider } from '@/contexts/QueryProvider';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

const columns = [
  { header: 'No. Daftar', accessor: 'no_daftar' as const },
  { header: 'Nama', accessor: 'nama' as const },
  { header: 'Jenjang', accessor: 'jenjang' as const },
  { header: 'Tgl Lahir', accessor: 'tanggal_lahir' as const },
  { header: 'Alamat', accessor: 'alamat' as const },
  { header: 'Status', accessor: 'status' as const },
];

function SpmbContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendaftar');

  useEffect(() => {
    setLoading(true);
    fetch('/api/siswa/lookup?status=' + filter)
      .then(res => res.json())
      .then(json => {
        setData(json.siswa || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SPMB SD/TK/KB (V2 - Penerimaan Murid Baru)</h1>
      
      <div className="flex gap-2 mb-4">
        <Button 
          variant={filter === 'pendaftar' ? 'default' : 'outline'} 
          onClick={() => setFilter('pendaftar')}
        >
          Pendaftar
        </Button>
        <Button 
          variant={filter === 'diterima' ? 'default' : 'outline'} 
          onClick={() => setFilter('diterima')}
        >
          Diterima
        </Button>
        <Button 
          variant={filter === 'cadangan' ? 'default' : 'outline'} 
          onClick={() => setFilter('cadangan')}
        >
          Cadangan
        </Button>
      </div>

      {loading && <div>Memuat data...</div>}
      {!loading && data.length === 0 && <div>Tidak ada data pendaftar.</div>}
      {!loading && data.length > 0 && (
        <DataTable data={data} columns={columns} keyField="no_daftar" />
      )}
    </div>
  );
}

export default function SpmbV2Page() {
  return (
    <QueryProvider>
      <SpmbContent />
    </QueryProvider>
  );
}
