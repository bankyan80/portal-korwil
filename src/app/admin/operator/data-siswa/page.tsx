'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSiswa } from '@/hooks/useSiswa';
import { useAppStore } from '@/store/app-store';
import { normalizeSchool } from '@/lib/normalize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { AdminDeleteDialog } from '@/components/shared/AdminTable';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, setDoc,
} from 'firebase/firestore';
import {
  Search, Loader2, Plus, Pencil, Trash2, Save, School, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { QueryProvider } from '@/contexts/QueryProvider';

const PAGE_SIZE = 20;

interface SiswaForm {
  nik: string;
  nama: string;
  jk: string;
  nisn: string;
  tanggal_lahir: string;
  sekolah: string;
  jenjang: string;
  kelas: number;
  desa: string;
  alasan: string;
}

const defaultForm: SiswaForm = {
  nik: '', nama: '', jk: 'L', nisn: '', tanggal_lahir: '',
  sekolah: '', jenjang: 'SD', kelas: 1, desa: '', alasan: '',
};

function DataSiswaContent() {
  const { user } = useAppStore();
  const [jenjang, setJenjang] = useState<string | undefined>(undefined);
  const { data: apiData, isLoading: apiLoading, error } = useSiswa(jenjang);

  // Local state (Firestore overlay for operator edits)
  const [allSiswa, setAllSiswa] = useState<any[]>([]);
  const dbReadyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const mountedRef = useRef(true);

  // UI state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SiswaForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const userSchool = user?.schoolName || '';

  // Load Firestore overlay on mount (no setState in effect body)
  useEffect(() => {
    mountedRef.current = true;
    if (!db) {
      setTimeout(() => { if (mountedRef.current) setReady(true); }, 0);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'students'),
      (snap) => {
        if (!mountedRef.current) return;
        const fs: any[] = [];
        snap.forEach((d) => {
          const s = d.data() as any;
          if (normalizeSchool(s.sekolah || '') === normalizeSchool(userSchool) && s.status !== 'lulus') {
            fs.push({ id: d.id, ...s });
          }
        });
        setAllSiswa(fs);
        if (!dbReadyRef.current) { dbReadyRef.current = true; setReady(true); }
      },
      () => { if (mountedRef.current && !dbReadyRef.current) { dbReadyRef.current = true; setReady(true); } },
    );
    return () => {
      mountedRef.current = false;
      unsub?.();
    };
  }, [userSchool]);

  // Merge API data + Firestore, filter by operator school
  const mergedSiswa = useMemo(() => {
    const apiList = (apiData || []) as any[];
    const fsNiks = new Set(allSiswa.map((s) => s.nik));
    const merged = [...allSiswa, ...apiList.filter((s) => !fsNiks.has(s.nik))];
    const q = normalizeSchool(userSchool);
    return merged.filter((s) => normalizeSchool(s.sekolah || '') === q);
  }, [apiData, allSiswa, userSchool]);

  // Search filter
  const filteredSiswa = useMemo(() => {
    const q = search.toLowerCase();
    return q ? mergedSiswa.filter((s) => s.nama?.toLowerCase().includes(q) || s.nik?.includes(q)) : mergedSiswa;
  }, [mergedSiswa, search]);

  // Sort: Kelas 6 at top, then 5,4,3,2,1; non-SD at bottom
  const sortedSiswa = useMemo(() => {
    return [...filteredSiswa].sort((a, b) => {
      const kelasA = a.jenjang === 'SD' && a.kelas ? (7 - a.kelas) : -1;
      const kelasB = b.jenjang === 'SD' && b.kelas ? (7 - b.kelas) : -1;
      return kelasB - kelasA;
    });
  }, [filteredSiswa]);

  const totalPages = Math.max(1, Math.ceil(sortedSiswa.length / PAGE_SIZE));
  const paginatedSiswa = sortedSiswa.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  const total = mergedSiswa.length;
  const totalL = mergedSiswa.filter((s) => s.jk === 'L').length;
  const totalP = mergedSiswa.filter((s) => s.jk === 'P').length;

  // ── CRUD ──
  function openAdd() {
    setEditingId(null);
    setForm({ ...defaultForm, sekolah: userSchool });
    setFormOpen(true);
  }

  function openEdit(s: any) {
    setEditingId(s.id || null);
    setForm({
      nik: s.nik || '', nama: s.nama || '', jk: s.jk || 'L',
      nisn: s.nisn || '', tanggal_lahir: s.tanggal_lahir || '',
      sekolah: s.sekolah || userSchool, jenjang: s.jenjang || 'SD',
      kelas: s.kelas || 1, desa: s.desa || '', alasan: s.alasan || '',
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.nama.trim() || !form.nik.trim()) { toast.error('Nama dan NIK harus diisi'); return; }
    setSaving(true);
    try {
      const data: any = {
        ...form,
        schoolId: user?.schoolId || '',
        nisn: form.nisn || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (!db) {
        if (editingId) {
          setAllSiswa((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...data } : s)));
        } else {
          setAllSiswa((prev) => [{ id: Date.now().toString(), ...data }, ...prev]);
        }
      } else if (editingId) {
        await setDoc(doc(db, 'students', editingId), data, { merge: true });
      } else {
        await addDoc(collection(db, 'students'), { ...data, nik: form.nik });
      }
      toast.success(editingId ? 'Data siswa diperbarui' : 'Data siswa ditambahkan');
      setFormOpen(false);
    } catch (e) {
      console.error('Error saving siswa:', e);
      toast.error('Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      if (db) await deleteDoc(doc(db, 'students', id));
      setAllSiswa((prev) => prev.filter((s) => s.id !== id));
      toast.success('Data siswa dihapus');
    } catch (e) {
      console.error('Error deleting siswa:', e);
      toast.error('Gagal menghapus data');
    } finally {
      setDeleteId(null);
    }
  }

  if (apiLoading || !ready) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground py-20 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">Gagal memuat data</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Data Siswa</h1>

      {/* Jenjang filter */}
      <div className="flex gap-2 mb-4">
        <Button variant={!jenjang ? 'default' : 'outline'} onClick={() => setJenjang(undefined)}>Semua</Button>
        <Button variant={jenjang === 'SD' ? 'default' : 'outline'} onClick={() => setJenjang('SD')}>SD</Button>
        <Button variant={jenjang === 'TK' ? 'default' : 'outline'} onClick={() => setJenjang('TK')}>TK</Button>
        <Button variant={jenjang === 'KB' ? 'default' : 'outline'} onClick={() => setJenjang('KB')}>KB</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <School className="w-5 h-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Aktif</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div><p className="text-2xl font-bold">{totalL}</p><p className="text-xs text-muted-foreground">Laki-laki</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-rose-700 dark:text-rose-300" />
            </div>
            <div><p className="text-2xl font-bold">{totalP}</p><p className="text-xs text-muted-foreground">Perempuan</p></div>
          </div>
        </div>
      </div>

      <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg px-3 py-2 mb-4">
        Mengelola data siswa: <strong>{userSchool}</strong>
      </p>

      {/* Search + Tambah */}
      <div className="flex items-center gap-2 justify-between mb-4 flex-wrap">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau NISN..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
          <Plus className="w-4 h-4" /> Tambah
        </Button>
      </div>

      {/* Table */}
      {sortedSiswa.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Tidak ada data siswa</div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIK</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">L/P</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Kelas</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Jenjang</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Desa</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedSiswa.map((s, i) => (
                  <tr key={s.id || s.nik} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.nik}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{s.nama}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{s.jk}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {s.jenjang === 'SD' ? (s.kelas ? `Kelas ${s.kelas}` : '-') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${
                        s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' :
                        s.jenjang === 'TK' ? 'bg-pink-100 text-pink-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {s.jenjang}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.desa}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(s)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(s.id || '')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
            <span>
              Menampilkan {sortedSiswa.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–
              {Math.min(page * PAGE_SIZE, sortedSiswa.length)} dari {sortedSiswa.length} siswa
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Sebelumnya
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    className={p === page ? 'bg-blue-800 hover:bg-blue-900 text-white' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Berikutnya
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Data Siswa' : 'Tambah Data Siswa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIK *</Label>
                <Input value={form.nik} disabled={!!editingId} onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))} maxLength={16} />
              </div>
              <div className="space-y-2">
                <Label>NISN</Label>
                <Input value={form.nisn} onChange={(e) => setForm((f) => ({ ...f, nisn: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>JK</Label>
                <select
                  value={form.jk}
                  onChange={(e) => setForm((f) => ({ ...f, jk: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground"
                >
                  <option value="L">L</option>
                  <option value="P">P</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Jenjang</Label>
                <select
                  value={form.jenjang}
                  onChange={(e) => setForm((f) => ({ ...f, jenjang: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground"
                >
                  <option value="SD">SD</option>
                  <option value="TK">TK</option>
                  <option value="KB">KB</option>
                </select>
              </div>
              {form.jenjang === 'SD' && (
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <select
                    value={form.kelas}
                    onChange={(e) => setForm((f) => ({ ...f, kelas: Number(e.target.value) }))}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground"
                  >
                    {[1, 2, 3, 4, 5, 6].map((k) => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Tgl Lahir</Label>
                <Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm((f) => ({ ...f, tanggal_lahir: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sekolah</Label>
                <Input value={form.sekolah} onChange={(e) => setForm((f) => ({ ...f, sekolah: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Desa</Label>
                <Input value={form.desa} onChange={(e) => setForm((f) => ({ ...f, desa: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alasan <span className="text-xs text-muted-foreground">(tambahan)</span></Label>
              <textarea
                value={form.alasan}
                onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))}
                placeholder="Contoh: Mutasi masuk, data baru, perbaikan data..."
                rows={2}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground resize-none"
              />
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

      <AdminDeleteDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Hapus Data Siswa"
        description="Apakah Anda yakin ingin menghapus data siswa ini?"
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
}

export default function DataSiswaPage() {
  return (
    <QueryProvider>
      <DataSiswaContent />
    </QueryProvider>
  );
}
