'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { AdminEmptyState, AdminDeleteDialog } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  School, Users, BarChart3, Search, Loader2, Plus, Pencil, Trash2, Save, ArrowUp, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAutoSaveForm } from '@/hooks/useAutoSaveForm';

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
  const [refreshKey, setRefreshKey] = useState(0);

  const autoSave = useAutoSaveForm(
    { userId: user?.uid || 'anon', page: 'data_pd', formType: 'form' },
    undefined,
    800,
  );

  useEffect(() => {
    if (!formOpen) return;
    autoSave.load().then(saved => {
      if (saved && saved.form) {
        setForm(saved.form as typeof defaultForm);
        setEditingId(saved.editingId || null);
      }
    });
  }, [formOpen]);

  useEffect(() => {
    if (!formOpen) return;
    autoSave.debouncedSave({ form, editingId });
  }, [form, editingId, formOpen]);

  // Admin: fetch from student database API
  useEffect(() => {
    if (isOperator) return;
    async function fetchDb() {
      try {
        const res = await fetch('/api/siswa/list?limit=1000');
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
      let dbSiswa: SiswaRecord[] = [];
      try {
        const apiUrl = user?.schoolId
          ? `/api/siswa/list?schoolId=${user.schoolId}&sekolah=${encodeURIComponent(userSchool)}`
          : `/api/siswa/list?sekolah=${encodeURIComponent(userSchool)}`;

        console.log(`[ManageDataPd] Fetching API: ${apiUrl}`);
        const res = await fetch(apiUrl);
        const json = await res.json();
        console.log(`[ManageDataPd] API Result Count: ${json.siswa?.length || 0}`);
        dbSiswa = (json.siswa || [])
          .map((s: any) => ({
            id: s.id || s.nik,
            nik: s.nik, nama: s.nama, jk: s.jk, nisn: s.nisn || '',
            tanggal_lahir: s.tanggal_lahir || '', sekolah: s.sekolah || userSchool,
            jenjang: s.jenjang || 'SD', kelas: s.kelas ? Number(s.kelas) : undefined,
            desa: s.desa || '', createdAt: Date.now(),
          }));
      } catch (e) { console.error('Error fetching siswa API:', e); }

      let overlayRecords: SiswaRecord[] = [];
      try {
        console.log(`[ManageDataPd] Fetching overlay data...`);
        const res = await fetch('/api/siswa/manage');
        const json = await res.json();
        overlayRecords = (json.records || []).map((s: any) => ({
          id: s.nik, nik: s.nik, nama: s.nama, jk: s.jk, nisn: s.nisn || '',
          tanggal_lahir: s.tanggal_lahir || '', sekolah: s.sekolah || userSchool,
          jenjang: s.jenjang || 'SD', kelas: s.kelas ? Number(s.kelas) : undefined,
          desa: s.desa || '', createdAt: Date.now(),
        }));
      } catch (e) { console.error('Error fetching overlay:', e); }

      const mergedNiks = new Set(overlayRecords.map(s => s.nik));
      const finalData = [...overlayRecords, ...dbSiswa.filter(s => !mergedNiks.has(s.nik))];
      console.log(`[ManageDataPd] Final Merged Count: ${finalData.length} (${overlayRecords.length} from overlay)`);
      setAllSiswa(finalData);
      setLoading(false);
      loadingDone = true;
    }

    load();
  }, [isOperator, userSchool, user?.schoolId, refreshKey]);

  const totalSiswa = allSiswa.length;
  const totalL = allSiswa.filter(s => s.jk === 'L').length;
  const totalP = allSiswa.filter(s => s.jk === 'P').length;

  // Group siswa by class, ordered: SD 6→1, TK/KB Kelompok B → A, then lainnya
  const groupedByKelas = useMemo(() => {
    const groups: { label: string; key: string; siswa: SiswaRecord[] }[] = [];
    for (let k = 6; k >= 1; k--) {
      const siswa = allSiswa.filter(s => s.jenjang === 'SD' && s.kelas === k);
      if (siswa.length) groups.push({ label: `Kelas ${k}`, key: `sd-${k}`, siswa });
    }
    const sdNoKelas = allSiswa.filter(s => s.jenjang === 'SD' && (!s.kelas || s.kelas < 1));
    if (sdNoKelas.length) groups.push({ label: 'SD (Tanpa Kelas)', key: 'sd-nocls', siswa: sdNoKelas });
    // TK: Kelompok B → A
    for (const j of ['TK', 'KB'] as const) {
      const kelompokB = allSiswa.filter(s => s.jenjang === j && (s.kelas === 'B' || s.kelas === 2 || s.kelas === 'C' || s.kelas === 3));
      if (kelompokB.length) groups.push({ label: `${j} Kelompok B`, key: `${j}-b`, siswa: kelompokB });
      const kelompokA = allSiswa.filter(s => s.jenjang === j && (s.kelas === 'A' || s.kelas === 1));
      if (kelompokA.length) groups.push({ label: `${j} Kelompok A`, key: `${j}-a`, siswa: kelompokA });
      const lainnya = allSiswa.filter(s => s.jenjang === j && s.kelas !== 'A' && s.kelas !== 1 && s.kelas !== 'B' && s.kelas !== 2 && s.kelas !== 'C' && s.kelas !== 3);
      if (lainnya.length) groups.push({ label: j, key: j, siswa: lainnya });
    }
    const lain = allSiswa.filter(s => !['SD','TK','KB'].includes(s.jenjang));
    if (lain.length) groups.push({ label: 'Lainnya', key: 'lain', siswa: lain });
    return groups;
  }, [allSiswa]);

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
    const cleanNik = form.nik.replace(/\D/g, '');
    if (cleanNik.length !== 16) { toast.error('NIK harus 16 digit angka'); return; }
    setSaving(true);
    try {
      const record = { ...form, nik: cleanNik, schoolId: user?.schoolId || '', nisn: form.nisn || '' };
      const res = await fetch('/api/siswa/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', record }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? 'Data siswa diperbarui' : 'Data siswa ditambahkan');
        setFormOpen(false);
        setForm(defaultForm);
        void autoSave.clear();
        setRefreshKey(k => k + 1);
      } else {
        toast.error(json.error || 'Gagal menyimpan');
      }
    } catch (e) { console.error('Error saving siswa:', e); toast.error('Gagal menyimpan data'); } finally { setSaving(false); }
  }

  async function handleDelete(nik: string) {
    try {
      await fetch('/api/siswa/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', nik }),
      });
    } catch (e) { console.error('Error deleting siswa:', e); }
    setRefreshKey(k => k + 1);
    setDeleteId(null);
  }

  async function handlePromote() {
    setPromoting(true);
    try {
      const res = await fetch('/api/siswa/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promote' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${json.promoted} siswa SD berhasil naik kelas`);
        setRefreshKey(k => k + 1);
      } else {
        toast.error(json.error || 'Gagal menaikkan kelas');
      }
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

  // OPERATOR VIEW: Detail student list grouped by class (6→1)
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

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari NIK/nama..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full bg-background text-foreground" />
        </div>
        <Button onClick={() => { setCsvUrl(''); setImportResult(null); setImportOpen(true); }} variant="outline" className="gap-2">
          <Upload className="w-4 h-4" /> Import Dapodik
        </Button>
        <Button onClick={handlePromote} disabled={promoting} variant="outline" className="gap-2">
          {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          Naik Kelas
        </Button>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2"><Plus className="w-4 h-4" /> Tambah</Button>
      </div>

      {allSiswa.length === 0 ? (
        <AdminEmptyState icon={School} title="Belum ada data" description="Tambahkan data siswa baru" />
      ) : (
        <div className="space-y-6">
          {groupedByKelas.map(group => {
            const filtered = search
              ? group.siswa.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()) || s.nik.includes(search))
              : group.siswa;
            if (!filtered.length) return null;
            const l = filtered.filter(s => s.jk === 'L').length;
            const p = filtered.filter(s => s.jk === 'P').length;
            return (
              <div key={group.key} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                  <span className="text-xs text-muted-foreground">L: {l} &middot; P: {p} &middot; Total: {l + p}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground w-10">No</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">NIK</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">NISN</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Nama Siswa</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground w-12">JK</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground w-20">Jenjang</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground w-24">Kelas</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground hidden md:table-cell">Desa</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((s, i) => (
                        <tr key={s.id || s.nik} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.nik}</td>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.nisn || '-'}</td>
                          <td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">{s.nama}</td>
                          <td className="px-4 py-2 text-center text-muted-foreground">{s.jk}</td>
                          <td className="px-4 py-2 text-center"><span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${jenjangColors[s.jenjang]}`}>{s.jenjang}</span></td>
                          <td className="px-4 py-2 text-center font-semibold">{s.jenjang === 'SD' ? (s.kelas ? `Kelas ${s.kelas}` : '-') : s.jenjang === 'TK' || s.jenjang === 'KB' ? (s.kelas ? `Kelompok ${s.kelas}` : '-') : '-'}</td>
                          <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">{s.desa || '-'}</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteId(s.id || '')}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Data Siswa' : 'Tambah Data Siswa'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>NIK *</Label><Input value={form.nik} onChange={(e) => setForm(f => ({ ...f, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }))} maxLength={16} /></div>
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