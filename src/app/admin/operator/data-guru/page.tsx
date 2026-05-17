'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/features/DataTable';
import { usePegawaiAll } from '@/hooks/usePegawai';
import { useAppStore } from '@/store/app-store';
import { normalizeSchool } from '@/lib/normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
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
  const { user } = useAppStore();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data: allDataResult } = usePegawaiAll(search);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const resetSearch = () => { setSearch(''); setSearchInput(''); setPage(1); };
  const userSchool = user?.schoolName || '';
  const normalizedSchool = normalizeSchool(userSchool);

  // Filter ONLY this operator's school across all records
  const allPegawai = useMemo(() => {
    const items = allDataResult?.items || [];
    return items.filter(p =>
      normalizeSchool(p.sekolah || '') === normalizedSchool
    );
  }, [allDataResult, normalizedSchool]);

  // Client-side pagination (operator table is small)
  const PAGE_SIZE = 100;
  const total = allPegawai.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return allPegawai.slice(start, start + PAGE_SIZE);
  }, [allPegawai, page]);

  const guruCount = allPegawai.filter(p => p.jenis_ptk === 'Guru').length;
  const tendikCount = allPegawai.filter(p => p.jenis_ptk === 'Tenaga Kependidikan').length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data GTK (V2 - Guru &amp; Tendik)</h1>

      <div className="flex gap-2 mb-4 items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIP, NUPTK..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>Cari</Button>
        {search && (
          <Button variant="outline" onClick={resetSearch}>Reset</Button>
        )}
      </div>

      {!allDataResult && (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
        </div>
      )}

      {/* ── Flat paginated table ── */}
      <>
        {search && (
          <p className="text-xs text-muted-foreground mb-2">Hasil pencarian "{search}" — {total} record(s)</p>
        )}
        <DataTable data={paginated} columns={columns} keyField="nip" />
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Halaman {page} dari {totalPages} (Total: {total})
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Sebelumnya</Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Berikutnya</Button>
            </div>
          </div>
        )}
      </>
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
