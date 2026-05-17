'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/features/DataTable';
import { usePegawai, usePegawaiAll } from '@/hooks/usePegawai';
import { useAppStore } from '@/store/app-store';
import { normalizeSchool } from '@/lib/normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { GraduationCap, BookOpen, ChevronDown, Search, Loader2 } from 'lucide-react';
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

function groupByRole(items: any[]) {
  let guru: any[] = [];
  let tendik: any[] = [];
  let other: any[] = [];
  for (const r of items) {
    if (r.jenis_ptk === 'Guru') guru.push(r);
    else if (r.jenis_ptk === 'Tenaga Kependidikan') tendik.push(r);
    else other.push(r);
  }
  return { guru, tendik, other };
}

function GuruPerSekolah({ allData, schoolName }: { allData: any[]; schoolName: string }) {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [openRole, setOpenRole] = useState<'guru' | 'tendik' | 'other'>('guru');

  const filtered = useMemo(() => {
    if (!search) return allData;
    const q = search.toLowerCase();
    return allData.filter(p =>
      p.nama?.toLowerCase().includes(q) ||
      p.nik?.includes(q) ||
      p.nip?.includes(q) ||
      p.nuptk?.toLowerCase().includes(q)
    );
  }, [allData, search]);

  const { guru, tendik } = groupByRole(filtered);

  const handleSearch = () => { setSearch(searchInput); };

  return (
    <div className="space-y-3 mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Data Guru &amp; Tendik — {schoolName}</h2>

      <div className="flex gap-2">
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
          <Button variant="outline" onClick={() => { setSearch(''); setSearchInput(''); }}>
            Reset
          </Button>
        )}
      </div>

      {search && (
        <p className="text-xs text-muted-foreground">Hasil pencarian "{search}" — {filtered.length} record(s)</p>
      )}

      {/* Guru */}
      {guru.length > 0 && (
        <Collapsible open={openRole === 'guru'} onOpenChange={() => setOpenRole(openRole === 'guru' ? 'other' : 'guru')}>
          <div className="rounded-xl border bg-card overflow-hidden">
            <CollapsibleTrigger className="w-full text-left">
              <div className="flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-[#0d3b66]">Guru</span>
                  <span className="text-xs text-muted-foreground">({guru.length})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openRole === 'guru' ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left py-2 pr-3">Nama</th>
                      <th className="text-left py-2 pr-3">NIP</th>
                      <th className="text-left py-2 pr-3">NUPTK</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guru.map((r, i) => (
                      <tr key={r.nip || r.nik || i} className="border-t">
                        <td className="py-2 pr-3 font-medium">{r.nama}</td>
                        <td className="py-2 pr-3 font-mono">{r.nip || '-'}</td>
                        <td className="py-2 pr-3">{r.nuptk || '-'}</td>
                        <td className="py-2"><Badge variant="outline" className="text-[10px]">{r.status_kepegawaian}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Tendik */}
      {tendik.length > 0 && (
        <Collapsible open={openRole === 'tendik'} onOpenChange={() => setOpenRole(openRole === 'tendik' ? 'other' : 'tendik')}>
          <div className="rounded-xl border bg-card overflow-hidden">
            <CollapsibleTrigger className="w-full text-left">
              <div className="flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-purple-600 shrink-0" />
                  <span className="font-semibold text-[#0d3b66]">Tenaga Kependidikan</span>
                  <span className="text-xs text-muted-foreground">({tendik.length})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openRole === 'tendik' ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left py-2 pr-3">Nama</th>
                      <th className="text-left py-2 pr-3">NIP</th>
                      <th className="text-left py-2 pr-3">NUPTK</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tendik.map((r, i) => (
                      <tr key={r.nip || r.nik || i} className="border-t">
                        <td className="py-2 pr-3 font-medium">{r.nama}</td>
                        <td className="py-2 pr-3 font-mono">{r.nip || '-'}</td>
                        <td className="py-2 pr-3">{r.nuptk || '-'}</td>
                        <td className="py-2"><Badge variant="outline" className="text-[10px]">{r.status_kepegawaian}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {guru.length === 0 && tendik.length === 0 && (
        <div className="text-sm text-muted-foreground py-4">Tidak ada hasil</div>
      )}
    </div>
  );
}

function GuruContent() {
  const { user } = useAppStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading, error } = usePegawai(page, search);

  // Fetch all records (unpaginated) for per-school grouped view
  const { data: allDataResult } = usePegawaiAll(search);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const userSchool = user?.schoolName || '';
  const normalizedSchool = normalizeSchool(userSchool);

  const allPegawai = useMemo(() => {
    const items = allDataResult?.items || [];
    return items.filter(p =>
      normalizeSchool(p.sekolah || '') === normalizedSchool
    );
  }, [allDataResult, normalizedSchool]);

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
          <Button variant="outline" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
            Reset
          </Button>
        )}
      </div>

      {/* ── Per-sekolah grouped name view ── */}
      {!search && allPegawai.length > 0 && (
        <GuruPerSekolah allData={allPegawai} schoolName={userSchool} />
      )}

      {isLoading && !data && (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
        </div>
      )}
      {error && <div className="text-red-500 py-2">Gagal memuat data</div>}

      {/* ── Flat paginated table ── */}
      {data && (
        <>
          {!search && (
            <p className="text-xs text-muted-foreground mb-2">
              {guruCount} Guru, {tendikCount} Tendik — klik di atas untuk lihat nama per jenis
            </p>
          )}
          <DataTable data={data.items || []} columns={columns} keyField="nip" />
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              Halaman {data.page} dari {data.totalPages} (Total: {data.total})
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Sebelumnya</Button>
              <Button variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
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
