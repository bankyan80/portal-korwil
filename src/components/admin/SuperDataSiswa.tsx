'use client';

import { DataTable } from '@/components/features/DataTable';
import { useSiswa } from '@/hooks/useSiswa';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  type JenjangFilter = 'ALL' | 'SD' | 'TK' | 'KB';
  const [jenjangFilter, setJenjangFilter] = useState<JenjangFilter>('ALL');
  const [searchNama, setSearchNama] = useState('');
  const [searchNik, setSearchNik] = useState('');
  const { data: sdData, isLoading: sdLoading, error: sdError } = useSiswa('SD');
  const { data: tkData, isLoading: tkLoading, error: tkError } = useSiswa('TK');
  const { data: kbData, isLoading: kbLoading, error: kbError } = useSiswa('KB');

  const sdMapped = useMemo(() => sdData || [], [sdData]);
  const tkMapped = useMemo(() => withRombelLabel(tkData || []), [tkData]);
  const kbMapped = useMemo(() => withRombelLabel(kbData || []), [kbData]);

  const jenjangList: JenjangFilter[] = ['ALL', 'SD', 'TK', 'KB'];

  const JENJANG_LABEL: Record<string, string> = { SD: 'SD', TK: 'TK', KB: 'KB/PAUD' };

  const activeLoading = (jenjangFilter === 'SD' || jenjangFilter === 'ALL') ? sdLoading
    : (jenjangFilter === 'TK' ? tkLoading
    : (jenjangFilter === 'KB' ? kbLoading : false));

  const activeError = (jenjangFilter === 'SD' || jenjangFilter === 'ALL') ? sdError
    : (jenjangFilter === 'TK' ? tkError
    : (jenjangFilter === 'KB' ? kbError : null));

  const activeData = jenjangFilter === 'ALL'
    ? [...sdMapped, ...tkMapped, ...kbMapped]
    : (jenjangFilter === 'SD' ? sdMapped
    : (jenjangFilter === 'TK' ? tkMapped
    : kbMapped));

  const filteredData = useMemo(() => {
    if (!searchNama.trim() && !searchNik.trim()) return activeData;
    const qNama = searchNama.toLowerCase().trim();
    const qNik = searchNik.trim();
    return activeData.filter((d: any) => {
      const matchNama = !qNama || (d.nama || '').toLowerCase().includes(qNama);
      const matchNik = !qNik || (d.nik || '').includes(qNik);
      return matchNama && matchNik;
    });
  }, [activeData, searchNama, searchNik]);

  const activeColumns = jenjangFilter === 'SD' ? sdColumns : (jenjangFilter === 'TK' ? tkColumns : kbColumns);
  const activeSortFn = jenjangFilter === 'SD' ? sortSD : (jenjangFilter === 'TK' ? sortTK : sortKB);
  const activeTitle = jenjangFilter === 'ALL' ? 'Semua Jenjang' : (jenjangFilter === 'SD' ? 'SD' : (jenjangFilter === 'TK' ? 'TK' : 'KB/PAUD'));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Data Siswa</h1>
      <p className="text-sm text-muted-foreground mb-4">Seluruh data peserta didik semua sekolah</p>
      <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">Data ini sesuai dengan data Dapodik, jika ada perubahan silahkan hubungi Admin.</p>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex flex-wrap gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchNama}
              onChange={e => setSearchNama(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari NIK..."
              value={searchNik}
              onChange={e => setSearchNik(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Jenjang:</label>
            <select
              value={jenjangFilter}
              onChange={e => setJenjangFilter(e.target.value as JenjangFilter)}
              className="h-9 px-3 text-xs font-semibold rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0d3b66] cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            >
              {jenjangList.map(j => (
                <option key={j} value={j}>{j === 'ALL' ? 'Semua' : JENJANG_LABEL[j]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <SiswaTable title={activeTitle} data={filteredData} isLoading={activeLoading} error={activeError} columns={activeColumns} sortFn={activeSortFn} />
    </div>
  );
}
