'use client';

import { useState, useCallback } from 'react';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { useAppStore } from '@/store/app-store';
import { AdminEmptyState } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, query, where, getDocs, doc, setDoc, limit, orderBy
} from 'firebase/firestore';

// ... (skip lines)

export function ManageSpmbSd() {
  const { user } = useAppStore();
  // Tambahkan limit 100 untuk menghemat kuota Read saat pertama buka
  const spmbQuery = useMemo(() => [
    orderBy('createdAt', 'desc'),
    limit(100)
  ], []);

  const { items, addItem, updateItem, deleteItem } = useFirestoreCollection<Pendaftar>(
    'spmb_sd', 
    defaultData,
    'createdAt' // Field untuk ordering
  );
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');

  const { debouncedSave: autoSave, load: loadDraft, clear: clearDraft } = useAutoSaveForm<Record<string, unknown>>(
    { userId: 'admin', page: 'spmb-sd', formType: 'spmb-sd' },
    setAutoSaveStatus,
    800,
  );

  // NIK lookup state
  const [nikLookupLoading, setNikLookupLoading] = useState(false);
  const [nikLookupMsg, setNikLookupMsg] = useState('');

  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';

  const filtered = items.filter((d) => {
    if (isOperator && userSchool && !d.sekolah.toLowerCase().includes(userSchool.toLowerCase())) return false;
    if (search && !d.nama.toLowerCase().includes(search.toLowerCase()) && !d.nik.includes(search)) return false;
    return true;
  });

  const counts = {
    total: filtered.length,
    diterima: filtered.filter(d => d.status === 'Diverifikasi' || d.status === 'Valid').length,
    cadangan: filtered.filter(d => d.status === 'Cadangan').length,
    ditolak: filtered.filter(d => d.status === 'Ditolak').length,
  };

  // ── NIK auto-fill from database ──
  const lookupNIK = useCallback(async () => {
    const nik = form.nik.trim();
    if (nik.length < 16) {
      setNikLookupMsg('NIK harus 16 digit');
      return;
    }
    setNikLookupLoading(true);
    setNikLookupMsg('');
    try {
      const res = await fetch(`/api/siswa/lookup?nik=${encodeURIComponent(nik)}`);
      const json = await res.json();
      if (json.found && json.siswa) {
        const s = json.siswa;
        const usia = hitungUsia(s.tanggal_lahir || '');
        setForm(f => ({
          ...f,
          nama: s.nama || f.nama,
          usia,
          tanggal_lahir: s.tanggal_lahir || '',
          sekolah: s.sekolah || f.sekolah || userSchool,
          desa: s.desa || '',
          nisn: s.nisn || '',
        }));
        setNikLookupMsg('Data siswa ditemukan — formulir diisi otomatis');
        toast.success('Data siswa ditemukan');
      } else {
        setNikLookupMsg('NIK tidak ditemukan dalam database');
        toast.info('NIK tidak ditemukan, silakan isi manual');
      }
    } catch {
      setNikLookupMsg('Gagal mencari data');
      toast.error('Gagal mencari data siswa');
    } finally {
      setNikLookupLoading(false);
    }
  }, [form.nik, userSchool]);

  // Auto-lookup when NIK reaches 16 digits
  const handleNikChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    updateForm(f => ({ ...f, nik: cleaned }));
    if (cleaned.length === 16) {
      setTimeout(() => {
        if (form.nik.length === 16) return;
        lookupNIK();
      }, 300);
    }
  };

  // Trigger lookup on button click
  const handleNIKSearch = async () => {
    await lookupNIK();
  };

  async function openAdd() {
    setEditingId(null);
    const base = { ...defaultForm, sekolah: userSchool || '' };
    const draft = await loadDraft();
    setForm(draft ? (draft as typeof defaultForm) : base);
    setNikLookupMsg('');
    setFormOpen(true);
  }

  async function openEdit(item: Pendaftar) {
    setEditingId(item.id);
    const base = { nama: item.nama, nik: item.nik, jalur: item.jalur, usia: item.usia, status: item.status, tglDaftar: item.tglDaftar, sekolah: item.sekolah, tanggal_lahir: item.tanggal_lahir || '', alasan: item.alasan || '' };
    const draft = await loadDraft();
    setForm(draft ? (draft as typeof defaultForm) : base);
    setNikLookupMsg('');
    setFormOpen(true);
  }

  function updateForm(updater: (prev: typeof defaultForm) => typeof defaultForm) {
    setForm(updater);
    const next = updater(form);
    autoSave(next as unknown as Record<string, unknown>);
  }

  async function save() {
    if (!form.nama.trim() || !form.nik.trim()) return;
    const usia = hitungUsia(form.tanggal_lahir || '');
    if (usia < MIN_USIA) {
      toast.error(`Usia calon siswa adalah ${usia} tahun — belum memenuhi syarat minimal ${MIN_USIA} tahun`);
      return;
    }
    const payload = { ...form, usia };
    try {
      if (editingId) {
        await updateItem(editingId, payload);
        if (acceptedStatuses.includes(form.status)) {
          const original = items.find(i => i.id === editingId);
          if (original) await autoAddToDataPd({ ...original, ...payload });
        }
      } else {
        await addItem(payload);
        if (acceptedStatuses.includes(form.status)) {
          await autoAddToDataPd({ id: '', ...payload });
        }
      }
      await clearDraft();
      setFormOpen(false);
      setForm(defaultForm);
    } catch (e: any) {
      console.error('Error saving spmb:', e);
      if (e.code === 'unavailable' || e.message?.includes('offline') || e.message?.includes('network')) {
        try {
          await enqueue(editingId ? 'update' : 'create', 'spmb_sd', editingId || `spmb-${Date.now()}`, form);
          toast.info(editingId ? 'Data akan diperbarui saat online' : 'Data akan ditambahkan saat online');
          setFormOpen(false);
        } catch {}
      } else {
        toast.error('Gagal menyimpan data pendaftar');
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Pendaftar', value: counts.total, icon: Users, color: 'text-blue-600' },
          { label: 'Diterima', value: counts.diterima, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Cadangan', value: counts.cadangan, icon: Clock, color: 'text-orange-600' },
          { label: 'Ditolak', value: counts.ditolak, icon: XCircle, color: 'text-red-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{item.value}</p></div>
                <Icon className={`w-8 h-8 opacity-30 ${item.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari pendaftar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2"><Plus className="w-4 h-4" /> Tambah</Button>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState icon={FileText} title="Belum ada pendaftar" description="Data pendaftar SPMB belum ditambahkan" />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">NIK</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Usia</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((d, i) => (
                  <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{d.nama}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{d.nik}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{d.usia} thn</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-[11px] font-medium rounded-full ${statusColor[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(d)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteItem(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Pendaftar' : 'Tambah Pendaftar'} <span className="ml-2 inline-flex"><AutoSaveStatusBadge status={autoSaveStatus} /></span></DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {/* ── NIK + Cari (di atas) ── */}
            <div className="space-y-2">
              <Label>NIK</Label>
              <div className="flex gap-2">
                <Input
                  value={form.nik}
                  onChange={(e) => handleNikChange(e.target.value)}
                  placeholder="16 digit NIK — cari di database untuk auto-fill"
                  maxLength={16}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNIKSearch}
                  disabled={nikLookupLoading || form.nik.length < 16}
                  title="Cari NIK di database"
                  className="shrink-0 h-10 w-10"
                >
                  {nikLookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {nikLookupMsg && (
                <p className={`text-xs ${nikLookupMsg.includes('tidak ditemukan') || nikLookupMsg.includes('Gagal') ? 'text-amber-600' : 'text-blue-600'}`}>
                  {nikLookupMsg}
                </p>
              )}
            </div>

            <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={form.nama} onChange={(e) => updateForm(f => ({ ...f, nama: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tanggal Lahir</Label>
                <Input type="date" value={form.tanggal_lahir}
                  onChange={(e) => updateForm(f => ({ ...f, tanggal_lahir: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Usia</Label>
                <div className="flex items-center h-10">
                  <span className={`text-sm font-semibold ${hitungUsia(form.tanggal_lahir) < MIN_USIA ? 'text-red-600' : 'text-green-600'}`}>
                    {hitungUsia(form.tanggal_lahir)} tahun
                    {hitungUsia(form.tanggal_lahir) < MIN_USIA && ` — belum cukup ${MIN_USIA} tahun`}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jalur</Label>
                <select value={form.jalur} onChange={(e) => updateForm(f => ({ ...f, jalur: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  <option value="Domisili">Domisili</option><option value="Afirmasi">Afirmasi</option>
                  <option value="Mutasi">Mutasi</option><option value="Prestasi">Prestasi</option>
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Sekolah Tujuan</Label><Input value={form.sekolah} onChange={(e) => updateForm(f => ({ ...f, sekolah: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => {
                const newStatus = e.target.value;
                updateForm(f => ({ ...f, status: newStatus }));
              }}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {acceptedStatuses.includes(form.status) && (
                <p className="text-xs text-green-600 mt-1">Status diterima: siswa otomatis masuk Data PD Kelas 1</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              <Save className="w-4 h-4" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
