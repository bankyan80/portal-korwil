'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { normalizeSchool } from '@/lib/normalize';
import { AdminEmptyState, AdminDeleteDialog } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot,
} from 'firebase/firestore';
import {
  School, Users, BookOpen, BadgeCheck, Search, Loader2, Plus, Pencil, Trash2, Save, GraduationCap,
} from 'lucide-react';
import { toast } from 'sonner';

interface PegawaiRecord {
  id?: string;
  nik: string;
  nama: string;
  jk: string;
  nuptk?: string;
  nip?: string;
  tanggal_lahir: string;
  status_kepegawaian: string;
  jenis_ptk: string;
  tugas_tambahan?: string;
  sertifikasi: string;
  sekolah: string;
  createdAt: number;
}

interface SchoolGtkSummary {
  name: string;
  teachers: number;
  staff: number;
  total: number;
  certified: number;
  headmaster: string;
  teachers_l: number;
  teachers_p: number;
  staff_l: number;
  staff_p: number;
  l: number;
  p: number;
}

const PTK_OPTIONS = ['Guru', 'Tenaga Kependidikan', 'Kepala Sekolah', 'Pengawas', 'Lainnya'];
const STATUS_OPTIONS = ['PNS', 'PPPK', 'Honor Daerah TK.II Kab/Kota', 'Guru Honor Sekolah', 'Tenaga Honor Sekolah', 'PPPK Paruh Waktu'];
const TUGAS_TAMBAHAN_OPTIONS = ['', 'Kepala Sekolah', 'Bendahara BOS/BOP', 'Kepala Laboratorium', 'Pembina Pramuka Putra', 'Kepala Perpustakaan', 'Pelaksana PBJ', 'Pembina Pramuka Putri'];

const defaultForm = { nik: '', nama: '', jk: 'L', nuptk: '', nip: '', tanggal_lahir: '', status_kepegawaian: 'PPPK', jenis_ptk: 'Guru', tugas_tambahan: '', sertifikasi: '', sekolah: '' };

export function ManageDataGtk() {
  const { user } = useAppStore();
  const [schoolSummary, setSchoolSummary] = useState<SchoolGtkSummary[]>([]);
  const [allPegawai, setAllPegawai] = useState<PegawaiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';

  useEffect(() => {
    if (!db) { setLoading(false); return; }

    if (!isOperator) {
      fetch('/api/pegawai/gtk-summary')
        .then(r => r.json())
        .then(json => setSchoolSummary(json.schools || []))
        .catch((e) => { console.error('Error fetching GTK summary:', e); setSchoolSummary([]); })
        .finally(() => setLoading(false));
      return;
    }

    const q = query(collection(db, 'employees'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: PegawaiRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PegawaiRecord));
      setAllPegawai(list.filter(p =>
        normalizeSchool(p.sekolah || '') === normalizeSchool(userSchool)
      ));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [isOperator, userSchool]);

  const filteredPegawai = useMemo(() => {
    if (!search) return allPegawai;
    const q = search.toLowerCase();
    return allPegawai.filter(p =>
      p.nama?.toLowerCase().includes(q) || p.nik?.includes(q)
    );
  }, [allPegawai, search]);

  const totalPegawai = allPegawai.length;
  const totalL = allPegawai.filter(p => p.jk === 'L').length;
  const totalP = allPegawai.filter(p => p.jk === 'P').length;

  function openAdd() {
    setEditingId(null);
    setForm({ ...defaultForm, sekolah: userSchool });
    setFormOpen(true);
  }

  function openEdit(item: PegawaiRecord) {
    setEditingId(item.id || null);
    setForm({
      nik: item.nik, nama: item.nama, jk: item.jk,
      nuptk: item.nuptk || '',
      nip: item.nip || '',
      tanggal_lahir: item.tanggal_lahir || '',
      status_kepegawaian: item.status_kepegawaian || 'PPPK',
      jenis_ptk: item.jenis_ptk || 'Guru',
      tugas_tambahan: item.tugas_tambahan || '',
      sertifikasi: item.sertifikasi || '',
      sekolah: item.sekolah,
    });
    setFormOpen(true);
  }

  async function handleSave() {
    const cleanNik = form.nik.replace(/\D/g, '');
    if (cleanNik.length !== 16) { toast.error('NIK harus 16 digit'); return; }
    if (!form.nama.trim()) { toast.error('Nama harus diisi'); return; }
    if (!editingId && allPegawai.some(p => p.nik === cleanNik)) { toast.error('NIK sudah terdaftar'); return; }
    setSaving(true);
    try {
      const data = { nik: cleanNik, nama: form.nama.trim(), jk: form.jk, nuptk: form.nuptk, nip: form.nip, tanggal_lahir: form.tanggal_lahir, status_kepegawaian: form.status_kepegawaian, jenis_ptk: form.jenis_ptk, tugas_tambahan: form.tugas_tambahan, sertifikasi: form.sertifikasi, sekolah: form.sekolah, schoolId: user?.schoolId || '', createdAt: Date.now(), updatedAt: Date.now() };
      if (!db) {
        if (editingId) setAllPegawai(prev => prev.map(p => p.id === editingId ? { ...p, ...data } : p));
        else setAllPegawai(prev => [{ id: Date.now().toString(), ...data }, ...prev]);
      } else {
        if (editingId) await updateDoc(doc(db, 'employees', editingId), data);
        else await addDoc(collection(db, 'employees'), data);
      }
      toast.success(editingId ? 'Data pegawai diperbarui' : 'Data pegawai ditambahkan');
      setFormOpen(false);
    } catch (e) { console.error('Error saving pegawai:', e); toast.error('Gagal menyimpan data'); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!db) setAllPegawai(prev => prev.filter(p => p.id !== id));
    else try { await deleteDoc(doc(db, 'employees', id)); } catch (e) { console.error('Error deleting pegawai:', e); }
    setDeleteId(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!isOperator) {
    const totalSekolah = schoolSummary.length;
    const totalAll = schoolSummary.reduce((a, s) => a + s.total, 0);
    const totalGuru = schoolSummary.reduce((a, s) => a + s.teachers, 0);
    const totalTendik = schoolSummary.reduce((a, s) => a + s.staff, 0);
    const totalCertified = schoolSummary.reduce((a, s) => a + s.certified, 0);
    const totalAllL = schoolSummary.reduce((a, s) => a + s.l, 0);
    const totalAllP = schoolSummary.reduce((a, s) => a + s.p, 0);

    const filteredSummary = schoolSummary.filter(item => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><School className="w-5 h-5 text-blue-700 dark:text-blue-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSekolah}</p><p className="text-xs text-muted-foreground">Sekolah</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-700 dark:text-emerald-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAll}</p><p className="text-xs text-muted-foreground">Total GTK</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-indigo-700 dark:text-indigo-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalGuru}</p><p className="text-xs text-muted-foreground">Guru</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center"><BookOpen className="w-5 h-5 text-purple-700 dark:text-purple-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTendik}</p><p className="text-xs text-muted-foreground">Tendik</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center"><BadgeCheck className="w-5 h-5 text-amber-700 dark:text-amber-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCertified}</p><p className="text-xs text-muted-foreground">Sertifikasi</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center"><Users className="w-5 h-5 text-cyan-700 dark:text-cyan-300" /></div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{totalAllL}</span>
                  <span className="text-xs text-muted-foreground">/</span>
                  <span className="text-lg font-bold text-pink-700 dark:text-pink-300">{totalAllP}</span>
                </div>
                <p className="text-xs text-muted-foreground">L / P</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari sekolah..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full bg-background text-foreground" />
        </div>

        {filteredSummary.length === 0 ? (
          <AdminEmptyState icon={School} title="Tidak ada data" description="Belum ada data GTK" />
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sekolah</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Guru</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Tendik</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Total</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Guru L</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Guru P</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Tendik L</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Tendik P</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Sertifikasi</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kepsek</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSummary.map((item, i) => (
                    <tr key={item.name} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.teachers}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.staff}</td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">{item.total}</td>
                      <td className="px-4 py-3 text-center text-xs font-medium text-blue-600">{item.teachers_l}</td>
                      <td className="px-4 py-3 text-center text-xs font-medium text-pink-600">{item.teachers_p}</td>
                      <td className="px-4 py-3 text-center text-xs font-medium text-blue-600">{item.staff_l}</td>
                      <td className="px-4 py-3 text-center text-xs font-medium text-pink-600">{item.staff_p}</td>
                      <td className="px-4 py-3 text-center"><span className="text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-full">{item.certified}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.headmaster}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">Menampilkan {filteredSummary.length} sekolah</div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Data bersumber dari database pegawai + tambahan operator sekolah.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><Users className="w-5 h-5 text-blue-700 dark:text-blue-300" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPegawai}</p><p className="text-xs text-muted-foreground">Total Tambahan</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center"><Users className="w-5 h-5 text-sky-700 dark:text-sky-300" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalL}</p><p className="text-xs text-muted-foreground">Laki-laki</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center"><Users className="w-5 h-5 text-rose-700 dark:text-rose-300" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalP}</p><p className="text-xs text-muted-foreground">Perempuan</p></div>
          </div>
        </div>
      </div>

      <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg px-3 py-2">
        Mengelola data pegawai: <strong>{userSchool}</strong>
      </p>

      <div className="flex items-center gap-2 justify-between flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari NIK/nama..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full bg-background text-foreground" />
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2"><Plus className="w-4 h-4" /> Tambah Pegawai</Button>
      </div>

      {filteredPegawai.length === 0 ? (
        <AdminEmptyState icon={School} title="Belum ada data" description="Tambahkan data pegawai baru" />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIK</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">JK</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Jenis</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">Tugas Tambahan</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPegawai.map((p, i) => (
                  <tr key={p.id || p.nik} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.nik}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{p.nama}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{p.jk}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${
                        p.jenis_ptk === 'Guru' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' :
                        p.jenis_ptk === 'Tenaga Kependidikan' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {p.jenis_ptk === 'Guru' ? 'Guru' : p.jenis_ptk === 'Tenaga Kependidikan' ? 'Tendik' : p.jenis_ptk}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{p.status_kepegawaian || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{p.tugas_tambahan || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(p.id || '')}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t text-xs text-muted-foreground">{filteredPegawai.length} pegawai</div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Data Pegawai' : 'Tambah Data Pegawai'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>NIK *</Label><Input value={form.nik} onChange={(e) => setForm(f => ({ ...f, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }))} maxLength={16} /></div>
              <div className="space-y-2">
                <Label>JK</Label>
                <select value={form.jk} onChange={(e) => setForm(f => ({ ...f, jk: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground"><option value="L">L</option><option value="P">P</option></select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>NUPTK</Label><Input value={form.nuptk} onChange={(e) => setForm(f => ({ ...f, nuptk: e.target.value }))} placeholder="Nomor unik PTK" /></div>
              <div className="space-y-2"><Label>NIP</Label><Input value={form.nip} onChange={(e) => setForm(f => ({ ...f, nip: e.target.value }))} placeholder="Nomor induk pegawai" /></div>
            </div>
            <div className="space-y-2"><Label>Nama Lengkap *</Label><Input value={form.nama} onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jenis PTK</Label>
                <select value={form.jenis_ptk} onChange={(e) => setForm(f => ({ ...f, jenis_ptk: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {PTK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status Kepegawaian</Label>
                <select value={form.status_kepegawaian} onChange={(e) => setForm(f => ({ ...f, status_kepegawaian: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tugas Tambahan</Label>
                <select value={form.tugas_tambahan} onChange={(e) => setForm(f => ({ ...f, tugas_tambahan: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {TUGAS_TAMBAHAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Tidak ada'}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Tgl Lahir</Label><Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm(f => ({ ...f, tanggal_lahir: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Sertifikasi</Label><Input value={form.sertifikasi} onChange={(e) => setForm(f => ({ ...f, sertifikasi: e.target.value }))} placeholder="Mapel sertifikasi" /></div>
            <div className="space-y-2"><Label>Sekolah</Label><Input value={form.sekolah} onChange={(e) => setForm(f => ({ ...f, sekolah: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Hapus Data Pegawai" description="Apakah Anda yakin ingin menghapus data pegawai ini?"
        onConfirm={() => deleteId && handleDelete(deleteId)} />
    </div>
  );
}
