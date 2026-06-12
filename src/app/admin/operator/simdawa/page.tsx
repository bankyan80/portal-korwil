'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Users, Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { ExportButton } from '@/components/shared/ExportButton';
import { ImportButton } from '@/components/shared/ImportButton';
import AuthGuard from '@/components/auth/AuthGuard';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

const kelasOptions = ['1', '2', '3', '4', '5', '6', 'A', 'B', 'KB'];
const statusSiswaOptions = ['Aktif', 'Tidak Aktif', 'Mutasi', 'Alumni', 'Keluar'];

interface StudentData {
  id: string;
  schoolId: string;
  nama: string;
  nisn: string;
  nik: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  kelas: string;
  statusSiswa: string;
  namaAyah: string;
  namaIbu: string;
  alamat: string;
  keterangan: string;
  createdAt: string;
  updatedAt: string;
}

const defaultForm: Partial<StudentData> = {
  schoolId: '', nama: '', nisn: '', nik: '', jenisKelamin: 'L',
  tempatLahir: '', tanggalLahir: '', kelas: '1', statusSiswa: 'Aktif',
  namaAyah: '', namaIbu: '', alamat: '', keterangan: '',
};

export default function OperatorSimdawa() {
  const { user } = useAppStore();
  const [data, setData] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<StudentData>>({ ...defaultForm });
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.schoolId) { setError('Sekolah belum ditentukan. Hubungi admin.'); setLoading(false); return; }
    try {
      const res = await fetch(`/api/firestore/students?limit=1000&field=schoolId&value=${user.schoolId}`);
      const json = await res.json();
      setData(json.items || []);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(s => {
    if (filterStatus !== 'Semua' && s.statusSiswa !== filterStatus) return false;
    if (filterKelas !== 'Semua' && s.kelas !== filterKelas && s.kelompok !== filterKelas) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.nama?.toLowerCase().includes(q) || s.nisn?.includes(q) || s.nik?.includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...defaultForm, schoolId: user?.schoolId || '' });
    setShowForm(true);
  };

  const openEdit = (item: StudentData) => {
    setEditId(item.id);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.schoolId) return;
    if (form.nisn && !/^\d{10}$/.test(form.nisn)) { setError('NISN harus 10 digit angka'); return; }
    if (form.nik && !/^\d{16}$/.test(form.nik)) { setError('NIK harus 16 digit angka'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/firestore/students', {
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
    if (!confirm('Hapus data siswa ini?')) return;
    try {
      await fetch(`/api/firestore/students?id=${id}`, { method: 'DELETE' });
      setLoading(true);
      await fetchData();
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); }
  };

  if (!user) return null;

  const columns = [
    { key: 'nama', label: 'Nama', render: (r: StudentData) => <span className="font-medium">{r.nama}</span> },
    { key: 'nisn', label: 'NISN', className: 'text-center' },
    { key: 'jenisKelamin', label: 'L/P', className: 'text-center', render: (r: StudentData) => r.jenisKelamin || r.jk || '-' },
    { key: 'kelas', label: 'Kelas', className: 'text-center', render: (r: StudentData) => r.kelas || r.kelompok || '-' },
    { key: 'statusSiswa', label: 'Status', className: 'text-center', render: (r: StudentData) => <StatusBadge status={r.statusSiswa || 'Aktif'} /> },
    {
      key: 'actions', label: 'Aksi', className: 'text-center', sortable: false,
      render: (r: StudentData) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="SIMDAWA">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <h1 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5" /> SIMDAWA</h1>
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari nama, NISN, NIK..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white" />
          </div>
          <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Kelas</option>
            {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Status</option>
            {statusSiswaOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ExportButton collection="students" schoolId={user?.schoolId} />
          <ImportButton collection="students" onSuccess={() => { setLoading(true); fetchData(); }} />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 shrink-0">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={Users} message="Tidak ada data siswa" />
        ) : (
          <DataTable columns={columns} data={filtered} keyExtractor={r => r.id} />
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{editId ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nama *</label>
                  <input value={form.nama || ''} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NISN</label>
                  <input value={form.nisn || ''} onChange={e => setForm(f => ({ ...f, nisn: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NIK</label>
                  <input value={form.nik || ''} onChange={e => setForm(f => ({ ...f, nik: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                  <select value={form.jenisKelamin || 'L'} onChange={e => setForm(f => ({ ...f, jenisKelamin: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kelas</label>
                  <select value={form.kelas || '1'} onChange={e => setForm(f => ({ ...f, kelas: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Siswa</label>
                  <select value={form.statusSiswa || 'Aktif'} onChange={e => setForm(f => ({ ...f, statusSiswa: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    {statusSiswaOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
                  <input value={form.tempatLahir || ''} onChange={e => setForm(f => ({ ...f, tempatLahir: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                  <input type="date" value={form.tanggalLahir || ''} onChange={e => setForm(f => ({ ...f, tanggalLahir: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Ayah</label>
                  <input value={form.namaAyah || ''} onChange={e => setForm(f => ({ ...f, namaAyah: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Ibu</label>
                  <input value={form.namaIbu || ''} onChange={e => setForm(f => ({ ...f, namaIbu: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Alamat</label>
                  <textarea value={form.alamat || ''} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Keterangan</label>
                  <input value={form.keterangan || ''} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
              </div>
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
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
