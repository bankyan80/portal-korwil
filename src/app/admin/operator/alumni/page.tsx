'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { GraduationCap, Search, Loader2, Pencil, Trash2, Plus } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function OperatorAlumni() {
  const { user } = useAppStore();
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAlumniStatus, setFilterAlumniStatus] = useState('');
  const [filterTahun, setFilterTahun] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');

  const schoolId = user?.schoolId || '';

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/firestore/alumni?limit=10000`).then(r => r.json());
      const items = (res.items || []).filter((d: any) => d.schoolId === schoolId);
      setAlumni(items);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { if (schoolId) fetchData(); else setLoading(false); }, [schoolId, fetchData]);

  const uniqueTahun = [...new Set(alumni.map(a => a.tahunLulus).filter(Boolean))].sort((a: any, b: any) => Number(b) - Number(a));

  const filtered = alumni.filter(d => {
    if (filterAlumniStatus && d.alumniStatus !== filterAlumniStatus) return false;
    if (filterTahun !== 'Semua' && d.tahunLulus !== filterTahun) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.nama?.toLowerCase().includes(q) || d.nisn?.includes(q) || d.nik?.includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ schoolId, namaSekolah: user?.schoolName || '', jenjang: user?.jenjang || 'SD' });
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
      const body = {
        id: editId || undefined,
        data: { ...form, updatedAt: new Date().toISOString() },
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

  const melanjutkan = alumni.filter(d => d.alumniStatus === 'melanjutkan');
  const tidakMelanjutkan = alumni.filter(d => d.alumniStatus === 'tidak_melanjutkan');

  return (
    <AuthGuard requiredRoles={['operator']} requireActive featureName="Alumni">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Alumni</h1>
        <p className="text-sm text-blue-200">{user.displayName || ''} • {user.schoolName || ''}</p>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold">{alumni.length}</p><p className="text-xs text-muted-foreground">Total Alumni</p></div>
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold text-green-700">{melanjutkan.length}</p><p className="text-xs text-muted-foreground">Melanjutkan</p></div>
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold text-red-700">{tidakMelanjutkan.length}</p><p className="text-xs text-muted-foreground">Tidak Melanjutkan</p></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari nama, NISN, NIK..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white" />
          </div>
          <select value={filterAlumniStatus} onChange={e => setFilterAlumniStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="">Semua Status</option>
            <option value="melanjutkan">Melanjutkan</option>
            <option value="tidak_melanjutkan">Tidak Melanjutkan</option>
          </select>
          <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Tahun</option>
            {uniqueTahun.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 shrink-0">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500"><GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p>Tidak ada data alumni</p></div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2 font-medium">Nama</th>
                  <th className="text-center px-3 py-2 font-medium">NISN/NIK</th>
                  <th className="text-center px-3 py-2 font-medium">L/P</th>
                  <th className="text-center px-3 py-2 font-medium">Thn Lulus</th>
                  <th className="text-center px-3 py-2 font-medium">Status</th>
                  <th className="text-center px-3 py-2 font-medium">Detail</th>
                  <th className="text-center px-3 py-2 font-medium">Aksi</th>
                </tr></thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={d.id || d.nisn || d.nik || i} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{d.nama}</td>
                      <td className="px-3 py-2 text-center text-xs font-mono">{d.nisn || d.nik || '-'}</td>
                      <td className="px-3 py-2 text-center">{d.jenisKelamin}</td>
                      <td className="px-3 py-2 text-center">{d.tahunLulus || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        {d.alumniStatus === 'melanjutkan' ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Melanjutkan</span>
                          : d.alumniStatus === 'tidak_melanjutkan' ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Tidak Melanjutkan</span>
                          : <span className="text-xs text-gray-400">-</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">{d.alumniDetail || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                          {d.id && <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                  <label className="block text-sm font-medium mb-1">Tahun Lulus</label>
                  <input type="number" value={form.tahunLulus || ''} onChange={e => setForm(f => ({ ...f, tahunLulus: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
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
