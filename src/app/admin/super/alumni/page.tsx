'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { GraduationCap, Search, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';

const statusAlumniOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'melanjutkan', label: 'Melanjutkan' },
  { value: 'tidak_melanjutkan', label: 'Tidak Melanjutkan' },
];

export default function SuperAlumni() {
  const { user } = useAppStore();
  const [data, setData] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterAlumniStatus, setFilterAlumniStatus] = useState('');
  const [filterSchool, setFilterSchool] = useState('Semua');
  const [filterTahun, setFilterTahun] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');

  const getSchoolName = (id: string) => schools.find(s => s.id === id)?.namaSekolah || id;

  const fetchData = useCallback(async () => {
    try {
      const [aRes, sRes, scRes] = await Promise.all([
        fetch('/api/firestore/alumni?limit=10000').then(r => r.json()),
        fetch('/api/firestore/students?limit=10000').then(r => r.json()),
        fetch('/api/firestore/schools').then(r => r.json()),
      ]);
      setData(aRes.items || []);
      setStudents((sRes.items || []).filter((s: any) => s.statusSiswa === 'Alumni' || s.statusSiswa === 'Lulus/Alumni'));
      setSchools(scRes.items || []);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allAlumni = useCallback(() => {
    const map = new Map<string, any>();
    for (const d of data) map.set(d.nisn || d.nik, d);
    for (const s of students) {
      const key = s.nisn || s.nik;
      if (!map.has(key)) {
        map.set(key, {
          id: '',
          nisn: s.nisn || '',
          nik: s.nik || '',
          nama: s.nama || '',
          jenisKelamin: s.jenisKelamin || s.jk || '',
          schoolId: s.schoolId || '',
          namaSekolah: s.namaSekolah || getSchoolName(s.schoolId),
          jenjang: s.jenjang || '',
          tahunLulus: s.tahunLulus || '',
          alumniStatus: '',
          alumniDetail: '',
        });
      }
    }
    return Array.from(map.values());
  }, [data, students, getSchoolName]);

  const merged = allAlumni();

  const uniqueTahun = [...new Set(merged.map(a => a.tahunLulus).filter(Boolean))].sort((a: any, b: any) => Number(b) - Number(a));

  const filtered = merged.filter(d => {
    if (filterJenjang !== 'Semua' && d.jenjang !== filterJenjang) return false;
    if (filterAlumniStatus && d.alumniStatus !== filterAlumniStatus) return false;
    if (filterSchool !== 'Semua' && d.schoolId !== filterSchool) return false;
    if (filterTahun !== 'Semua' && d.tahunLulus !== filterTahun) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.nama?.toLowerCase().includes(q) || d.nisn?.includes(q) || d.nik?.includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({});
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    setEditId(item.id || null);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama) return;
    setSaving(true);
    try {
      const body: any = {
        id: editId || undefined,
        data: {
          ...form,
          updatedAt: new Date().toISOString(),
        },
        merge: true,
      };
      const res = await fetch('/api/firestore/alumni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success || json.data) {
        setShowForm(false);
        setLoading(true);
        await fetchData();
      }
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data alumni ini?')) return;
    try {
      await fetch(`/api/firestore/alumni?id=${id}`, { method: 'DELETE' });
      setLoading(true);
      await fetchData();
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); }
  };

  if (!user) return null;

  const melanjutkan = merged.filter(d => d.alumniStatus === 'melanjutkan');
  const tidakMelanjutkan = merged.filter(d => d.alumniStatus === 'tidak_melanjutkan');
  const belumDiisi = merged.filter(d => !d.alumniStatus);

  const columns = [
    { key: 'nama', label: 'Nama', render: (r: any) => <span className="font-medium">{r.nama}</span> },
    { key: 'nisn', label: 'NISN/NIK', className: 'text-center', render: (r: any) => <span className="text-xs font-mono">{r.nisn || r.nik || '-'}</span> },
    { key: 'jenisKelamin', label: 'L/P', className: 'text-center' },
    { key: 'jenjang', label: 'Jenjang', className: 'text-center' },
    { key: 'sekolah', label: 'Asal Sekolah', className: 'text-center', render: (r: any) => <span className="text-xs">{r.namaSekolah || getSchoolName(r.schoolId)}</span> },
    { key: 'tahunLulus', label: 'Thn Lulus', className: 'text-center' },
    {
      key: 'alumniStatus', label: 'Status', className: 'text-center',
      render: (r: any) => {
        if (!r.alumniStatus) return <span className="text-xs text-gray-400">-</span>;
        return <StatusBadge status={r.alumniStatus === 'melanjutkan' ? 'Melanjutkan' : 'Tidak Melanjutkan'} />;
      },
    },
    {
      key: 'alumniDetail', label: 'Keterangan', className: 'text-center',
      render: (r: any) => <span className="text-xs">{r.alumniDetail || '-'}</span>,
    },
    {
      key: 'actions', label: 'Aksi', className: 'text-center', sortable: false,
      render: (r: any) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
          {r.id && <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Alumni">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Alumni</h1>
        <p className="text-sm text-blue-200">{user.displayName || ''} • {merged.length} alumni</p>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold">{merged.length}</p><p className="text-xs text-muted-foreground">Total Alumni</p></div>
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold text-green-700">{melanjutkan.length}</p><p className="text-xs text-muted-foreground">Melanjutkan</p></div>
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold text-red-700">{tidakMelanjutkan.length}</p><p className="text-xs text-muted-foreground">Tidak Melanjutkan</p></div>
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold text-amber-700">{belumDiisi.length}</p><p className="text-xs text-muted-foreground">Belum Diisi</p></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari nama, NISN, NIK..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white" />
          </div>
          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Jenjang</option>
            <option value="SD">SD</option>
            <option value="TK">TK</option>
            <option value="KB">KB</option>
          </select>
          <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Sekolah</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.namaSekolah}</option>)}
          </select>
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Tahun</option>
            {uniqueTahun.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterAlumniStatus} onChange={e => setFilterAlumniStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            {statusAlumniOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 shrink-0">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={GraduationCap} message="Tidak ada data alumni" />
        ) : (
          <DataTable columns={columns} data={filtered} keyExtractor={(r, i) => r.id || r.nisn || r.nik || String(i)} />
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{editId ? 'Edit Alumni' : 'Tambah Alumni'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama *</label>
                <input value={form.nama || ''} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">NISN</label>
                  <input value={form.nisn || ''} onChange={e => setForm(f => ({ ...f, nisn: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NIK</label>
                  <input value={form.nik || ''} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                  <select value={form.jenisKelamin || 'L'} onChange={e => setForm(f => ({ ...f, jenisKelamin: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenjang</label>
                  <select value={form.jenjang || 'SD'} onChange={e => setForm(f => ({ ...f, jenjang: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="SD">SD</option>
                    <option value="TK">TK</option>
                    <option value="KB">KB</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Asal Sekolah</label>
                <select value={form.schoolId || ''} onChange={e => {
                  const school = schools.find(s => s.id === e.target.value);
                  setForm(f => ({ ...f, schoolId: e.target.value, namaSekolah: school?.namaSekolah || '' }));
                }} className="w-full px-3 py-2 rounded-lg border text-sm">
                  <option value="">Pilih Sekolah</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.namaSekolah} ({s.jenjang})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tahun Lulus</label>
                <input type="number" value={form.tahunLulus || ''} onChange={e => setForm(f => ({ ...f, tahunLulus: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status Alumni</label>
                <select value={form.alumniStatus || ''} onChange={e => setForm(f => ({ ...f, alumniStatus: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                  <option value="">Pilih Status</option>
                  <option value="melanjutkan">Melanjutkan</option>
                  <option value="tidak_melanjutkan">Tidak Melanjutkan</option>
                </select>
              </div>
              {form.alumniStatus === 'melanjutkan' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Sekolah Tujuan</label>
                  <input value={form.alumniDetail || ''} onChange={e => setForm(f => ({ ...f, alumniDetail: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="Nama sekolah lanjutan..." />
                </div>
              )}
              {form.alumniStatus === 'tidak_melanjutkan' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Alasan</label>
                  <textarea value={form.alumniDetail || ''} onChange={e => setForm(f => ({ ...f, alumniDetail: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={3} placeholder="Alasan tidak melanjutkan..." />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.nama}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editId ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
