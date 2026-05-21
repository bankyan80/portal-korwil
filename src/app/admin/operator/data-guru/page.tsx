'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/features/DataTable';
import { usePegawaiAll } from '@/hooks/usePegawai';
import { useAppStore } from '@/store/app-store';
import { normalizeSchool } from '@/lib/normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Search, Loader2, Save, Pencil, Loader2 as LoaderIcon } from 'lucide-react';
import { toast } from 'sonner';
import { QueryProvider } from '@/contexts/QueryProvider';

export const dynamic = 'force-dynamic';

const PTK_OPTIONS = ['Guru', 'Tenaga Kependidikan', 'Kepala Sekolah', 'Pengawas', 'Lainnya'];
const STATUS_OPTIONS = ['PNS', 'PPPK', 'Honor Daerah TK.II Kab/Kota', 'Guru Honor Sekolah', 'Tenaga Honor Sekolah', 'PPPK Paruh Waktu', 'GTY/PTY', 'Non ASN', 'CPNS'];
const TUGAS_TAMBAHAN_OPTIONS = [
  '', 'Kepala Sekolah', 'Bendahara BOS/BOP', 'Kepala Laboratorium',
  'Pembina Pramuka Putra', 'Kepala Perpustakaan', 'Pelaksana PBJ', 'Pembina Pramuka Putri',
];

const defaultForm = {
  nik: '', nama: '', jk: 'L', nuptk: '', nip: '', tanggal_lahir: '',
  status_kepegawaian: 'PPPK', jenis_ptk: 'Guru', tugas_tambahan: '',
  sertifikasi: '', sekolah: '',
};

function GuruContent() {
  const { user } = useAppStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const { data: allDataResult, isLoading, isError, error } = usePegawaiAll(search);

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

  // Edit modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  function openEdit(record: Record<string, any>) {
    setEditingRecord(record);
    setForm({
      nik: record.nik || '',
      nama: record.nama || '',
      jk: record.jk || 'L',
      nuptk: record.nuptk || '',
      nip: record.nip || '',
      tanggal_lahir: record.tanggal_lahir || '',
      status_kepegawaian: record.status_kepegawaian || 'PPPK',
      jenis_ptk: record.jenis_ptk || 'Guru',
      tugas_tambahan: record.tugas_tambahan || '',
      sertifikasi: record.sertifikasi || '',
      sekolah: record.sekolah || userSchool,
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!editingRecord) return;
    if (!form.nama.trim()) { toast.error('Nama harus diisi'); return; }
    const nikToUpdate = editingRecord.nik || editingRecord.nip || '';
    if (!nikToUpdate) { toast.error('NIK/NIP wajib diisi'); return; }
    setSaving(true);
    try {
      const body = { ...form, nama: form.nama.trim() };
      const res = await fetch(`/api/pegawai/${encodeURIComponent(nikToUpdate)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Data pegawai berhasil diperbarui');
        setFormOpen(false);
        window.location.reload();
      } else {
        toast.error(data.error || 'Gagal menyimpan data');
      }
    } catch {
      toast.error('Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { header: 'No', accessor: ((_row: any, i: number) => i + 1) as any },
    { header: 'NIK', accessor: 'nik' as const },
    {
      header: 'Nama',
      accessor: ((row: any) => (
        <button onClick={() => openEdit(row)} className="text-blue-700 hover:underline dark:text-blue-300">
          {row.nama}
        </button>
      )) as any,
    },
    { header: 'NIP', accessor: 'nip' as const },
    { header: 'NUPTK', accessor: 'nuptk' as const },
    { header: 'JK', accessor: 'jk' as const },
    { header: 'Status', accessor: 'status_kepegawaian' as const },
    {
      header: 'Aksi',
      accessor: (row: any) => (
        <button onClick={() => openEdit(row)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-2xl font-bold">Data GTK (V2 - Guru &amp; Tendik)</h1>
      </div>
      <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg px-3 py-2 mb-4">
        Mengelola data pegawai: <strong>{userSchool}</strong>
      </p>

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

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-4">
          <span className="text-sm">Gagal memuat data pegawai: {error?.message || 'Kesalahan jaringan'}. <button onClick={() => window.location.reload()} className="underline font-medium">Muat ulang</button></span>
        </div>
      )}
      {!isLoading && !isError && !normalizedSchool && (
        <div className="text-amber-600 bg-amber-50 rounded-lg px-4 py-3 mb-4 text-sm">
          Data sekolah tidak ditemukan untuk akun Anda. Hubungi administrator.
        </div>
      )}
      {!isLoading && !isError && normalizedSchool && allPegawai.length === 0 && (
        <div className="text-muted-foreground py-4 text-sm">
          Belum ada data pegawai untuk sekolah ini.
        </div>
      )}

      {/* ── Flat paginated table ── */}
      <>
        {paginated.length > 0 && (
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
        <p className="text-xs text-muted-foreground mt-2">Guru: {guruCount} | Tendik: {tendikCount}</p>
          </>
        )}
      </>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Data Pegawai — {editingRecord?.sekolah || userSchool}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIK</Label>
                <Input value={form.nik} disabled className="bg-gray-50 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Label>JK</Label>
                <select value={form.jk} onChange={e => setForm(f => ({ ...f, jk: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  <option value="L">L</option>
                  <option value="P">P</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NUPTK</Label>
                <Input value={form.nuptk} onChange={e => setForm(f => ({ ...f, nuptk: e.target.value }))} placeholder="Nomor unik PTK" />
              </div>
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input value={form.nip} onChange={e => setForm(f => ({ ...f, nip: e.target.value }))} placeholder="Nomor induk pegawai" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jenis PTK</Label>
                <select value={form.jenis_ptk} onChange={e => setForm(f => ({ ...f, jenis_ptk: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {PTK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status Kepegawaian</Label>
                <select value={form.status_kepegawaian} onChange={e => setForm(f => ({ ...f, status_kepegawaian: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tugas Tambahan</Label>
                <select value={form.tugas_tambahan} onChange={e => setForm(f => ({ ...f, tugas_tambahan: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {TUGAS_TAMBAHAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Tidak ada'}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tgl Lahir</Label>
                <Input type="date" value={form.tanggal_lahir} onChange={e => setForm(f => ({ ...f, tanggal_lahir: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sertifikasi</Label>
              <Input value={form.sertifikasi} onChange={e => setForm(f => ({ ...f, sertifikasi: e.target.value }))} placeholder="Mapel sertifikasi" />
            </div>
            <div className="space-y-2">
              <Label>Sekolah</Label>
              <Input value={form.sekolah} readOnly className="bg-gray-50 dark:bg-gray-800" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              {saving ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
