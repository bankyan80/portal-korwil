'use client';

import { useMemo, useState } from 'react';
import { usePegawaiAll } from '@/hooks/usePegawai';
import { useAppStore } from '@/store/app-store';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Users, GraduationCap, BookOpen, Search, MapPin, School as SchoolIcon,
  Save, Loader2,
} from 'lucide-react';
import { allSekolah } from '@/data/sekolah';
import { toast } from 'sonner';
import { normalizeSchool } from '@/lib/normalize';
import type { UserRole } from '@/types';

// Build a lookup: normalized firestore-style name → canonical name from master data
const schoolDisplayLookup = new Map<string, string>();
for (const s of allSekolah) {
  const nk = normalizeSchool(s.nama);
  if (nk && !schoolDisplayLookup.has(nk)) schoolDisplayLookup.set(nk, s.nama);
  // also index by raw name (case-normalized) so exact matches work too
  if (s.nama && !schoolDisplayLookup.has(s.nama.toUpperCase())) schoolDisplayLookup.set(s.nama.toUpperCase(), s.nama);
}

/** Return the canonical (short) school name from the master list, or the original name if no match found. */
function displaySchoolName(rawName: string): string {
  if (!rawName) return '-';
  // Try normalized lookup
  const norm = normalizeSchool(rawName);
  if (norm && schoolDisplayLookup.has(norm)) return schoolDisplayLookup.get(norm)!;
  // Try uppercase exact match on master names
  const up = rawName.toUpperCase();
  if (schoolDisplayLookup.has(up)) return schoolDisplayLookup.get(up)!;
  return rawName;
}

type JenjangFilter = 'ALL' | 'SD' | 'TK' | 'KB';

export default function SuperDataGuru() {
  const { data: allDataResult, isLoading } = usePegawaiAll();
  const [searchSekolah, setSearchSekolah] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState<JenjangFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState({
    nik: '', nama: '', jk: 'L', nuptk: '', nip: '', tanggal_lahir: '',
    status_kepegawaian: 'PPPK', jenis_ptk: 'Guru', tugas_tambahan: '',
    sertifikasi: '', sekolah: '',
  });
  const [saving, setSaving] = useState(false);

  const currentUser = useAppStore(s => s.user);
  const userRole = currentUser?.role;
  const userSchoolName = currentUser?.schoolName || '';

  const canEditRecord = (record: Record<string, any>) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'operator_sekolah') {
      const recordSchool = displaySchoolName(record.sekolah || '');
      return recordSchool === userSchoolName;
    }
    return false;
  };

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
      sekolah: record.sekolah || '',
    });
    setFormOpen(true);
  }

  const PTK_OPTIONS = ['Guru', 'Tenaga Kependidikan', 'Kepala Sekolah', 'Pengawas', 'Lainnya'];
  const STATUS_OPTIONS = ['PNS', 'PPPK', 'Honor Daerah TK.II Kab/Kota', 'Guru Honor Sekolah', 'Tenaga Honor Sekolah', 'PPPK Paruh Waktu', 'GTY/PTY', 'Non ASN', 'CPNS'];
  const TUGAS_TAMBAHAN_OPTIONS = [
    '', 'Kepala Sekolah', 'Bendahara BOS/BOP', 'Kepala Laboratorium',
    'Pembina Pramuka Putra', 'Kepala Perpustakaan', 'Pelaksana PBJ', 'Pembina Pramuka Putri',
  ];

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

  // Build per-sekolah aggregation from pegawai data
  const sekolahAgg = useMemo(() => {
    const items = allDataResult?.items || [];
    const aggMap: Record<string, { guru: number; tendik: number; total: number }> = {};
    for (const r of items) {
      const keyName = (r.sekolah || '').trim() || '-';
      const nama = displaySchoolName(keyName);
      if (!aggMap[nama]) aggMap[nama] = { guru: 0, tendik: 0, total: 0 };
      if (r.jenis_ptk === 'Guru') aggMap[nama].guru++;
      else if (r.jenis_ptk === 'Tenaga Kependidikan') aggMap[nama].tendik++;
      aggMap[nama].total++;
    }
    return aggMap;
  }, [allDataResult]);

  // All sekolah from master + their pegawai stats (jenjang always from master)
  const sekolahWithMeta = useMemo(() => {
    const pegawaiMap = new Map<string, { guru: number; tendik: number; total: number }>();
    for (const [nama, agg] of Object.entries(sekolahAgg)) {
      pegawaiMap.set(displaySchoolName(nama), agg);
    }

    const result = allSekolah.map(s => ({
      ...s,
      guru: 0, tendik: 0, total: 0,
    }));

    // Merge pegawai counts into the master school list by canonical name
    for (const [nama, agg] of pegawaiMap.entries()) {
      const idx = result.findIndex(r => r.nama === nama);
      if (idx >= 0) { result[idx].guru = agg.guru; result[idx].tendik = agg.tendik; result[idx].total = agg.total; }
      else { result.push({ nama, jenjang: 'SD', guru: agg.guru, tendik: agg.tendik, total: agg.total } as any); }
    }

    return result;
  }, [sekolahAgg]);

  const jenjangList: JenjangFilter[] = ['ALL', 'SD', 'TK', 'KB'];

  const filteredData = useMemo(() => {
    return sekolahWithMeta.filter(s => {
      const matchesSearch = !searchSekolah || s.nama.toLowerCase().includes(searchSekolah.toLowerCase());
      const matchesJenjang = jenjangFilter === 'ALL' || s.jenjang === jenjangFilter;
      return matchesSearch && matchesJenjang;
    });
  }, [sekolahWithMeta, searchSekolah, jenjangFilter]);

  const JENJANG_LABEL: Record<string, string> = { SD: 'SD', TK: 'TK', KB: 'KB/PAUD' };
  const JENJANG_COLOR: Record<string, string> = {
    SD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    TK: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    KB: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  };
  const jalurLabel = (j: string) => JENJANG_LABEL[j] || j;
  const jalurColor = (j: string) => JENJANG_COLOR[j] || 'bg-gray-100 text-gray-700';

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Data GTK</h1>
      <p className="text-sm text-muted-foreground mb-4">Seluruh data pendidik dan tenaga kependidikan semua sekolah</p>
      <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">Data ini sesuai dengan data Dapodik, jika ada perubahan silahkan hubungi Admin.</p>

      {isLoading && !allDataResult && (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /> Memuat data...
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari nama sekolah..."
              value={searchSekolah}
              onChange={e => setSearchSekolah(e.target.value)}
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
                <option key={j} value={j}>{j === 'ALL' ? 'Semua' : jalurLabel(j)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {!isLoading && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 mb-5 text-sm">
          <span className="text-muted-foreground">Total sekolah: <strong className="text-gray-900 dark:text-gray-100">{filteredData.length}</strong></span>
          <span className="text-muted-foreground">Dengan pegawai: <strong className="text-emerald-600 dark:text-emerald-400">{filteredData.filter(s => s.total > 0).length}</strong></span>
          <span className="text-muted-foreground">Belum ada pegawai: <strong className="text-amber-600 dark:text-amber-400">{filteredData.filter(s => !s.total).length}</strong></span>
        </div>
      )}

      {/* School Cards */}
      {filteredData.length > 0 && (
        <div className="space-y-3">
          {filteredData.map(school => {
            const items = allDataResult?.items || [];
            const schoolDisplay = displaySchoolName(school.nama);
            const guruRecords = items.filter(r => displaySchoolName(r.sekolah) === schoolDisplay && r.jenis_ptk === 'Guru');
            const tendikRecords = items.filter(r => displaySchoolName(r.sekolah) === schoolDisplay && r.jenis_ptk === 'Tenaga Kependidikan');

            return (
              <div key={school.nama} className="rounded-xl border bg-card overflow-hidden shadow-sm">
                {/* School Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b bg-slate-50 dark:bg-slate-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SchoolIcon className="w-4.5 h-4.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-[#0d3b66] dark:text-blue-300 truncate text-sm">{school.nama}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${jalurColor(school.jenjang)}`}>
                      {jalurLabel(school.jenjang)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {school.total > 0 ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px]">
                          <GraduationCap className="w-3 h-3" /> {guruRecords.length} Guru
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[11px]">
                          <BookOpen className="w-3 h-3" /> {tendikRecords.length} Tendik
                        </span>
                        <span className="text-gray-500 text-[11px]">{guruRecords.length + tendikRecords.length} total</span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[11px]">
                        <MapPin className="w-3 h-3" /> Belum ada pegawai
                      </span>
                    )}
                  </div>
                </div>

                {/* Tables */}
                {school.total > 0 ? (
                  <div className="divide-y">
                    {guruRecords.length > 0 && (
                      <div>
                        <div className="px-5 pt-2.5 pb-1.5">
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                              Guru — {guruRecords.length}
                          </span>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="text-[11px] text-muted-foreground border-t">
                              <th className="text-left font-medium px-5 py-2">Nama</th>
                              <th className="text-left font-medium px-5 py-2">NIP</th>
                              <th className="text-left font-medium px-5 py-2 hidden sm:table-cell">NUPTK</th>
                              <th className="text-left font-medium px-5 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guruRecords.map((r, i) => (
                              <tr key={r.nik || r.nip || i} className="border-t hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                                <td className="px-5 py-2 text-[13px] font-medium">
                                  {canEditRecord(r) ? (
                                    <button onClick={() => openEdit(r)} className="text-blue-700 hover:underline dark:text-blue-300">{r.nama}</button>
                                  ) : (
                                    <span>{r.nama}</span>
                                  )}
                                </td>
                                <td className="px-5 py-2 text-[13px] font-mono text-gray-500">{r.nip || <span className="text-gray-400">-</span>}</td>
                                <td className="px-5 py-2 text-[13px] hidden sm:table-cell">{r.nuptk || <span className="text-gray-400">-</span>}</td>
                                <td className="px-5 py-2"><Badge variant="outline" className="text-[10px] h-5 px-2">{r.status_kepegawaian}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {tendikRecords.length > 0 && (
                      <div>
                        <div className="px-5 pt-2.5 pb-1.5">
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                            Tenaga Kependidikan &mdash; {tendikRecords.length}
                          </span>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="text-[11px] text-muted-foreground border-t">
                              <th className="text-left font-medium px-5 py-2">Nama</th>
                              <th className="text-left font-medium px-5 py-2">NIP</th>
                              <th className="text-left font-medium px-5 py-2 hidden sm:table-cell">NUPTK</th>
                              <th className="text-left font-medium px-5 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tendikRecords.map((r, i) => (
                              <tr key={r.nik || r.nip || i} className="border-t hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors">
                                <td className="px-5 py-2 text-[13px] font-medium">
                                  {canEditRecord(r) ? (
                                    <button onClick={() => openEdit(r)} className="text-blue-700 hover:underline dark:text-blue-300">{r.nama}</button>
                                  ) : (
                                    <span>{r.nama}</span>
                                  )}
                                </td>
                                <td className="px-5 py-2 text-[13px] font-mono text-gray-500">{r.nip || <span className="text-gray-400">-</span>}</td>
                                <td className="px-5 py-2 text-[13px] hidden sm:table-cell">{r.nuptk || <span className="text-gray-400">-</span>}</td>
                                <td className="px-5 py-2"><Badge variant="outline" className="text-[10px] h-5 px-2">{r.status_kepegawaian}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-5 py-4 text-xs text-muted-foreground text-center italic">
                    Belum ada data pegawai untuk sekolah ini
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredData.length === 0 && (
        <div className="text-sm text-muted-foreground py-8 text-center">Tidak ada sekolah yang sesuai dengan filter</div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Data Pegawai — {editingRecord?.sekolah || ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIK *</Label>
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
              <Input value={form.sekolah} onChange={e => setForm(f => ({ ...f, sekolah: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
