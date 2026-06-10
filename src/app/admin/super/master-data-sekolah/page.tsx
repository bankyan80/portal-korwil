'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { School, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { ExportButton } from '@/components/shared/ExportButton';
import { ImportButton } from '@/components/shared/ImportButton';
import AuthGuard from '@/components/auth/AuthGuard';
import { FilterBar } from '@/components/shared/FilterBar';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { JenjangBadge } from '@/components/shared/JenjangBadge';

interface SchoolData {
  id: string;
  namaSekolah: string;
  npsn: string;
  jenjang: string;
  statusSekolah: string;
  bentukSatuan: string;
  alamat: string;
  desa: string;
  kecamatan: string;
  kepalaSekolahId: string;
  operatorId: string;
  emailSekolah: string;
  nomorWa: string;
  jumlahRombel: number;
  isActive: boolean;
  isLocked: boolean;
  statusValidasi: string;
  keterangan: string;
  createdAt: string;
  updatedAt: string;
}

const defaultForm: Partial<SchoolData> = {
  namaSekolah: '', npsn: '', jenjang: 'SD', statusSekolah: 'Negeri',
  bentukSatuan: 'Sekolah', alamat: '', desa: '', kecamatan: 'Lemahabang',
  kepalaSekolahId: '', operatorId: '', emailSekolah: '', nomorWa: '',
  jumlahRombel: 0, isActive: true, isLocked: false, statusValidasi: 'Belum Validasi', keterangan: '',
};

export default function SuperMasterDataSekolah() {
  const { user } = useAppStore();
  const [data, setData] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<SchoolData>>({ ...defaultForm });
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/firestore/schools');
      const json = await res.json();
      setData(json.items || []);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(s => {
    if (filterJenjang !== 'Semua' && s.jenjang !== filterJenjang) return false;
    if (filterStatus !== 'Semua' && s.statusSekolah !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.namaSekolah?.toLowerCase().includes(q) || s.npsn?.includes(q) || s.desa?.toLowerCase().includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...defaultForm });
    setShowForm(true);
  };

  const openEdit = (item: SchoolData) => {
    setEditId(item.id);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.namaSekolah || !form.npsn) return;
    if (!/^\d{8}$/.test(form.npsn)) { setError('NPSN harus 8 digit angka'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/firestore/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId || undefined,
          data: { ...form, updatedAt: new Date().toISOString() },
          merge: true,
        }),
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
    if (!confirm('Nonaktifkan sekolah ini?')) return;
    try {
      await fetch(`/api/firestore/schools?id=${id}`, { method: 'DELETE' });
      setLoading(true);
      await fetchData();
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); }
  };

  if (!user) return null;

  const columns = [
    { key: 'namaSekolah', label: 'Nama Sekolah', render: (r: SchoolData) => <span className="font-medium">{r.namaSekolah}</span> },
    { key: 'npsn', label: 'NPSN', className: 'text-center' },
    { key: 'jenjang', label: 'Jenjang', className: 'text-center', render: (r: SchoolData) => <JenjangBadge jenjang={r.jenjang} /> },
    { key: 'statusSekolah', label: 'Status', className: 'text-center', render: (r: SchoolData) => <span className={`text-xs px-2 py-0.5 rounded-full ${r.statusSekolah === 'Negeri' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{r.statusSekolah}</span> },
    { key: 'desa', label: 'Desa', className: 'text-center' },
    { key: 'jumlahRombel', label: 'Rombel', className: 'text-center' },
    { key: 'isActive', label: 'Aktif', className: 'text-center', render: (r: SchoolData) => r.isActive !== false ? '✓' : '✗' },
    {
      key: 'actions', label: 'Aksi', className: 'text-center', sortable: false,
      render: (r: SchoolData) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Master Data Sekolah">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><School className="w-5 h-5" /> Master Data Sekolah</h1>
        <p className="text-sm text-blue-200">{user.displayName || ''} • {data.length} sekolah/lembaga</p>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <FilterBar
              search={search} onSearchChange={setSearch}
              searchPlaceholder="Cari nama sekolah, NPSN, desa..."
              jenjang={filterJenjang} onJenjangChange={setFilterJenjang}
              status={filterStatus} onStatusChange={setFilterStatus}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ExportButton collection="schools" />
            <ImportButton collection="schools" onSuccess={() => { setLoading(true); fetchData(); }} />
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
        </div>

        {loading ? <LoadingState message="Memuat data sekolah..." /> : filtered.length === 0 ? (
          <EmptyState icon={School} message="Tidak ada data sekolah" />
        ) : (
          <DataTable columns={columns} data={filtered} keyExtractor={r => r.id} />
        )}
      </main>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{editId ? 'Edit Sekolah' : 'Tambah Sekolah'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nama Sekolah/Lembaga *</label>
                  <input value={form.namaSekolah || ''} onChange={e => setForm(f => ({ ...f, namaSekolah: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NPSN *</label>
                  <input value={form.npsn || ''} onChange={e => setForm(f => ({ ...f, npsn: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenjang</label>
                  <select value={form.jenjang || 'SD'} onChange={e => setForm(f => ({ ...f, jenjang: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="SD">SD</option>
                    <option value="TK">TK</option>
                    <option value="KB">KB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={form.statusSekolah || 'Negeri'} onChange={e => setForm(f => ({ ...f, statusSekolah: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bentuk Satuan</label>
                  <select value={form.bentukSatuan || 'Sekolah'} onChange={e => setForm(f => ({ ...f, bentukSatuan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="Sekolah">Sekolah</option>
                    <option value="Lembaga">Lembaga</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Desa</label>
                  <input value={form.desa || ''} onChange={e => setForm(f => ({ ...f, desa: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Alamat</label>
                  <textarea value={form.alamat || ''} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input value={form.emailSekolah || ''} onChange={e => setForm(f => ({ ...f, emailSekolah: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nomor WA</label>
                  <input value={form.nomorWa || ''} onChange={e => setForm(f => ({ ...f, nomorWa: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah Rombel</label>
                  <input type="number" value={form.jumlahRombel || 0} onChange={e => setForm(f => ({ ...f, jumlahRombel: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.isActive !== false} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                    <span className="text-sm">Aktif</span>
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Keterangan</label>
                  <textarea value={form.keterangan || ''} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.namaSekolah || !/^\d{8}$/.test(form.npsn || '')}
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
