'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { AdminEmptyState, AdminDeleteDialog } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  collection, addDoc, deleteDoc, doc, setDoc, writeBatch, onSnapshot,
} from 'firebase/firestore';
import {
  School, Users, BarChart3, Search, Loader2, Plus, Pencil, Trash2, Save, ArrowUp, Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface SiswaRecord {
  id?: string;
  nik: string;
  nama: string;
  jk: string;
  nisn: string;
  tanggal_lahir: string;
  sekolah: string;
  jenjang: string;
  kelas: number;
  desa: string;
  alasan?: string;
  createdAt: number;
  status?: 'aktif' | 'lulus';
}

interface SchoolSummary {
  name: string;
  jenjang: string;
  total: number;
  l: number;
  p: number;
}

const kelasOptions = [1, 2, 3, 4, 5, 6];
const jenjangList = ['SD', 'TK', 'KB'] as const;
const jenjangColors: Record<string, string> = {
  SD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  TK: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  KB: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
};

const knownPrefixes = ['sd ', 'tk ', 'kb ', 'paud ', 'sps ', 'ra '];
const knownSuffixes = [' kecamatan lemahabang', ' kec. lemahabang', ' kabupaten cirebon'];
function normalizeSchool(name: string): string {
  let n = name.toLowerCase().trim();
  for (const p of knownPrefixes) {
    if (n.startsWith(p)) { n = n.slice(p.length); break; }
  }
  for (const s of knownSuffixes) {
    if (n.endsWith(s)) { n = n.slice(0, -s.length); break; }
  }
  return n.trim();
}

const defaultForm = { nik: '', nama: '', jk: 'L', nisn: '', tanggal_lahir: '', sekolah: '', jenjang: 'SD', kelas: 1, desa: '', alasan: '' };

export function ManageDataPd() {
  const { user } = useAppStore();
  const [allSiswa, setAllSiswa] = useState<SiswaRecord[]>([]);
  const [dbSummary, setDbSummary] = useState<SchoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [csvUrl, setCsvUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';

  // Admin: fetch from student database API
  useEffect(() => {
    if (isOperator) return;
    async function fetchDb() {
      try {
        const res = await fetch('/api/siswa/list');
        const json = await res.json();
        const siswa: any[] = json.siswa || [];
        const grouped: Record<string, SchoolSummary> = {};
        for (const s of siswa) {
          if (!s.sekolah) continue;
          const key = `${s.sekolah}||${s.jenjang}`;
          if (!grouped[key]) grouped[key] = { name: s.sekolah, jenjang: s.jenjang, total: 0, l: 0, p: 0 };
          grouped[key].total++;
          if (s.jk === 'L') grouped[key].l++; else grouped[key].p++;
        }
        setDbSummary(Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (e) { console.error('Error fetching db summary:', e); setDbSummary([]); } finally { setLoading(false); }
    }
    fetchDb();
  }, [isOperator]);

  // Operator: fetch from database API + Firestore overlay
  useEffect(() => {
    if (!isOperator) return;

    let unsubscribe: (() => void) | null = null;
    let loadingDone = false;

    async function load() {
      // Load API data (one-shot)
      let dbSiswa: SiswaRecord[] = [];
      try {
        const res = await fetch('/api/siswa/list');
        const json = await res.json();
        const q = normalizeSchool(userSchool);
        dbSiswa = (json.siswa || [])
          .filter((s: any) => normalizeSchool(s.sekolah || '') === q)
          .map((s: any) => ({
            nik: s.nik, nama: s.nama, jk: s.jk, nisn: s.nisn || '',
            tanggal_lahir: s.tanggal_lahir || '', sekolah: s.sekolah || userSchool,
            jenjang: s.jenjang || 'SD', kelas: s.kelas ? Number(s.kelas) : undefined,
            desa: s.desa || '', createdAt: Date.now(),
          }));
      } catch (e) { console.error('Error fetching siswa API:', e); }

      // Load Firestore overlay (realtime)
      const schoolFilter = normalizeSchool(userSchool);

      const computeMerged = (fsSiswa: SiswaRecord[]) => {
        const localNiks = new Set(fsSiswa.map(s => s.nik));
        return [...fsSiswa, ...dbSiswa.filter(s => !localNiks.has(s.nik))];
      };

      if (db) {
        try {
          unsubscribe = onSnapshot(
            collection(db, 'students'),
            (snap) => {
              const fsSiswa: SiswaRecord[] = [];
              snap.forEach((d) => {
                const s = d.data() as SiswaRecord;
                const normSekolah = normalizeSchool(s.sekolah || '');
                if (normSekolah === schoolFilter && s.status !== 'lulus') {
                  fsSiswa.push({ id: d.id, ...s });
                }
              });
              if (!loadingDone) {
                setAllSiswa(computeMerged(fsSiswa));
                setLoading(false);
                loadingDone = true;
              } else {
                setAllSiswa(computeMerged(fsSiswa));
              }
            },
            (err) => {
              console.error('Error in students realtime listener:', err);
              if (!loadingDone) {
                setAllSiswa(computeMerged([]));
                setLoading(false);
                loadingDone = true;
              }
            }
          );
        } catch (e) {
          console.error('Error loading Firestore students:', e);
          setAllSiswa(dbSiswa);
          setLoading(false);
          loadingDone = true;
        }
      } else {
        setAllSiswa(dbSiswa);
        setLoading(false);
        loadingDone = true;
      }
    }

    load();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOperator, userSchool]);

  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const filteredSiswa = useMemo(() => {
    const q = search.toLowerCase();
    return q ? allSiswa.filter(s => s.nama.toLowerCase().includes(q) || s.nik.includes(q)) : allSiswa;
  }, [allSiswa, search]);

  const sortedSiswa = useMemo(() => {
    return [...filteredSiswa].sort((a, b) => {
      const kelasA = a.jenjang === 'SD' ? (a.kelas || 999) : 999;
      const kelasB = b.jenjang === 'SD' ? (b.kelas || 999) : 999;
      return kelasB - kelasA;
    });
  }, [filteredSiswa]);

  const totalPages = Math.ceil(sortedSiswa.length / itemsPerPage);
  const paginatedSiswa = sortedSiswa.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => { setPage(1); }, [search]);

  const totalSiswa = allSiswa.length;
  const totalL = allSiswa.filter(s => s.jk === 'L').length;
  const totalP = allSiswa.filter(s => s.jk === 'P').length;

  function openAdd() {
    setEditingId(null);
    setForm({ ...defaultForm, sekolah: userSchool });
    setFormOpen(true);
  }

  function openEdit(item: SiswaRecord) {
    setEditingId(item.id || null);
    setForm({ nik: item.nik, nama: item.nama, jk: item.jk, nisn: item.nisn, tanggal_lahir: item.tanggal_lahir, sekolah: item.sekolah, jenjang: item.jenjang, kelas: item.kelas, desa: item.desa, alasan: item.alasan || '' });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.nama.trim() || !form.nik.trim()) { toast.error('Nama dan NIK harus diisi'); return; }
    setSaving(true);
    try {
      const data = { ...form, schoolId: user?.schoolId || '', nisn: form.nisn || '', createdAt: Date.now(), updatedAt: Date.now() };
      if (!db) {
        if (editingId) setAllSiswa(prev => prev.map(s => s.id === editingId ? { ...s, ...data } : s));
        else setAllSiswa(prev => [{ id: Date.now().toString(), ...data }, ...prev]);
      } else {
        if (editingId) {
          await setDoc(doc(db, 'students', editingId), data, { merge: true });
        } else {
          await addDoc(collection(db, 'students'), data);
        }
      }
      toast.success(editingId ? 'Data siswa diperbarui' : 'Data siswa ditambahkan');
      setFormOpen(false);
    } catch (e) { console.error('Error saving siswa:', e); toast.error('Gagal menyimpan data'); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!db) setAllSiswa(prev => prev.filter(s => s.id !== id));
    else try { await deleteDoc(doc(db, 'students', id)); } catch (e) { console.error('Error deleting siswa:', e); }
    setDeleteId(null);
  }

  async function handlePromote() {
    if (!db) { toast.error('Mode tidak mendukung'); return; }
    setPromoting(true);
    try {
      const batch = writeBatch(db);
      const sdSiswa = allSiswa.filter(s => s.jenjang === 'SD' && s.id && s.status !== 'lulus');
      for (const s of sdSiswa) {
        if (s.kelas >= 6) {
          batch.update(doc(db, 'students', s.id!), { status: 'lulus', alasan: `Lulus ${new Date().getFullYear()}`, updatedAt: Date.now() });
        } else {
          batch.update(doc(db, 'students', s.id!), { kelas: s.kelas + 1, updatedAt: Date.now() });
        }
      }
      await batch.commit();
      toast.success(`${sdSiswa.length} siswa SD berhasil naik kelas`);
    } catch (e) { console.error('Error promoting classes:', e); toast.error('Gagal menaikkan kelas'); } finally { setPromoting(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  // ADMIN VIEW: Recap from database
  if (!isOperator) {
    const totalSekolah = dbSummary.length;
    const totalAll = dbSummary.reduce((a, s) => a + s.total, 0);
    const totalAllL = dbSummary.reduce((a, s) => a + s.l, 0);
    const totalAllP = dbSummary.reduce((a, s) => a + s.p, 0);

    const filteredSummary = dbSummary.filter(item => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><School className="w-5 h-5 text-blue-700 dark:text-blue-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSekolah}</p><p className="text-xs text-muted-foreground">Sekolah</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-700 dark:text-emerald-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAll}</p><p className="text-xs text-muted-foreground">Total Siswa</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-sky-700 dark:text-sky-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAllL}</p><p className="text-xs text-muted-foreground">Laki-laki</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-rose-700 dark:text-rose-300" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalAllP}</p><p className="text-xs text-muted-foreground">Perempuan</p></div>
            </div>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari sekolah..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full bg-background text-foreground" />
        </div>

        {filteredSummary.length === 0 ? (
          <AdminEmptyState icon={School} title="Tidak ada data" description="Data dari database siswa" />
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jenjang</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama Sekolah</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">L</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">P</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSummary.map((item, i) => (
                    <tr key={`${item.name}-${item.jenjang}`} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${jenjangColors[item.jenjang]}`}>{item.jenjang}</span></td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.l}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.p}</td>
                      <td className="px-4 py-3 text-center font-semibold text-foreground">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">Menampilkan {filteredSummary.length} sekolah</div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Data bersumber dari database siswa Dapodik.</p>
      </div>
    );
  }

  // OPERATOR VIEW: Detail student list with CRUD
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center"><Users className="w-5 h-5 text-blue-700 dark:text-blue-300" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSiswa}</p><p className="text-xs text-muted-foreground">Total Aktif</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-sky-700 dark:text-sky-300" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalL}</p><p className="text-xs text-muted-foreground">Laki-laki</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-rose-700 dark:text-rose-300" /></div>
            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalP}</p><p className="text-xs text-muted-foreground">Perempuan</p></div>
          </div>
        </div>
      </div>

      <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg px-3 py-2">
        Mengelola data siswa: <strong>{userSchool}</strong>
      </p>

      {/* Per-kelas summary */}
      {allSiswa.some(s => s.jenjang === 'SD') && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Kelas</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">L</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">P</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[1,2,3,4,5,6].map(k => {
                  const siswa = allSiswa.filter(s => s.jenjang === 'SD' && s.kelas === k);
                  const l = siswa.filter(s => s.jk === 'L').length;
                  const p = siswa.filter(s => s.jk === 'P').length;
                  return (
                    <tr key={k} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">Kelas {k}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{l}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{p}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-foreground">{l + p}</td>
                    </tr>
                  );
                })}
                {(() => {
                  const siswa = allSiswa.filter(s => s.jenjang === 'SD' && !s.kelas);
                  const l = siswa.filter(s => s.jk === 'L').length;
                  const p = siswa.filter(s => s.jk === 'P').length;
                  return l + p > 0 ? (
                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-muted-foreground">-</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{l}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{p}</td>
                      <td className="px-4 py-2.5 text-center font-semibold text-foreground">{l + p}</td>
                    </tr>
                  ) : null;
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 justify-between flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari NIK/nama..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full bg-background text-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { setCsvUrl(''); setImportResult(null); setImportOpen(true); }} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" /> Import Dapodik
          </Button>
          <Button onClick={handlePromote} disabled={promoting} variant="outline" className="gap-2">
            {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            Naik Kelas
          </Button>
          <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2"><Plus className="w-4 h-4" /> Tambah</Button>
        </div>
      </div>

      {sortedSiswa.length === 0 ? (
        <AdminEmptyState icon={School} title="Belum ada data" description="Tambahkan data siswa baru" />
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
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Kelas</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Jenjang</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Desa</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedSiswa.map((s, i) => (
                  <tr key={s.id || s.nik} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{(page - 1) * itemsPerPage + i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.nik}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{s.nama}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{s.jk}</td>
                    <td className="px-4 py-3 text-center font-semibold">{s.jenjang === 'SD' ? (s.kelas ? `Kelas ${s.kelas}` : '-') : '-'}</td>
                    <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${jenjangColors[s.jenjang]}`}>{s.jenjang}</span></td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.desa}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(s.id || '')}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t text-xs text-muted-foreground flex items-center justify-between">
            <span>{sortedSiswa.length} siswa</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm"
                    className={p === page ? 'bg-blue-800 hover:bg-blue-900 text-white' : ''}
                    onClick={() => setPage(p)}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Data Siswa' : 'Tambah Data Siswa'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>NIK *</Label><Input value={form.nik} onChange={(e) => setForm(f => ({ ...f, nik: e.target.value }))} maxLength={16} /></div>
              <div className="space-y-2"><Label>NISN</Label><Input value={form.nisn} onChange={(e) => setForm(f => ({ ...f, nisn: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Nama Lengkap *</Label><Input value={form.nama} onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))} /></div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>JK</Label>
                <select value={form.jk} onChange={(e) => setForm(f => ({ ...f, jk: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground"><option value="L">L</option><option value="P">P</option></select>
              </div>
              <div className="space-y-2">
                <Label>Jenjang</Label>
                <select value={form.jenjang} onChange={(e) => setForm(f => ({ ...f, jenjang: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {jenjangList.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              {form.jenjang === 'SD' && (
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <select value={form.kelas} onChange={(e) => setForm(f => ({ ...f, kelas: Number(e.target.value) }))}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                    {kelasOptions.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-2"><Label>Tgl Lahir</Label><Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm(f => ({ ...f, tanggal_lahir: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Sekolah</Label><Input value={form.sekolah} onChange={(e) => setForm(f => ({ ...f, sekolah: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Desa</Label><Input value={form.desa} onChange={(e) => setForm(f => ({ ...f, desa: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <Label>Alasan <span className="text-xs text-muted-foreground">(tambahan)</span></Label>
              <Textarea value={form.alasan} onChange={(e) => setForm(f => ({ ...f, alasan: e.target.value }))} placeholder="Contoh: Mutasi masuk, data baru, perbaikan data..." rows={2} className="resize-none" />
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

      <AdminDeleteDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Hapus Data Siswa" description="Apakah Anda yakin ingin menghapus data siswa ini?"
        onConfirm={() => deleteId && handleDelete(deleteId)} />

      <Dialog open={importOpen} onOpenChange={(o) => { if (!o) { setImportOpen(false); setImportResult(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Import Data dari Dapodik</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Tempel URL CSV dari Dapodik untuk mengimpor data siswa <strong>{userSchool}</strong>.
            </p>
            <div className="space-y-2">
              <Label>URL CSV Dapodik</Label>
              <Input value={csvUrl} onChange={(e) => setCsvUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv" />
            </div>
            {importResult && (
              <div className={`text-sm rounded-lg px-3 py-2 ${importResult.startsWith('Berhasil') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                {importResult}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportResult(null); }}>Tutup</Button>
            <Button onClick={async () => {
              if (!csvUrl.trim()) { toast.error('Masukkan URL CSV'); return; }
              setImporting(true);
              setImportResult(null);
              try {
                const res = await fetch('/api/siswa/import-dapodik', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ csvUrl: csvUrl.trim() }),
                });
                const json = await res.json();
                if (json.success) {
                  setImportResult(`Berhasil mengimpor ${json.imported} siswa`);
                  toast.success(`Import berhasil: ${json.imported} siswa`);
                } else {
                  setImportResult(`Gagal: ${json.error || 'Unknown error'}`);
                  toast.error('Import gagal');
                }
              } catch (e) {
                setImportResult('Gagal menghubungi server');
                toast.error('Gagal mengimpor');
              } finally { setImporting(false); }
            }} disabled={importing} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Mengimpor...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
