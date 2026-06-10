'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { BookOpen, Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { ExportButton } from '@/components/shared/ExportButton';
import { ImportButton } from '@/components/shared/ImportButton';
import AuthGuard from '@/components/auth/AuthGuard';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

const jabatanOptions = [
  'Kepala Sekolah', 'Kepala TK', 'Kepala KB',
  'Guru Kelas', 'Guru PAI', 'Guru PJOK', 'Guru Mapel',
  'Guru TK', 'Pendidik TK', 'Pendidik KB',
  'Tendik', 'Operator',
];

interface EmployeeData {
  id: string;
  schoolId: string;
  nama: string;
  nip: string;
  nuptk: string;
  nik: string;
  jenisKelamin: string;
  jabatan: string;
  statusPegawai: string;
  statusAktif: string;
  pendidikanTerakhir: string;
  sertifikasi: string;
  nomorHp: string;
  email: string;
  keterangan: string;
  createdAt: string;
  updatedAt: string;
}

const defaultForm: Partial<EmployeeData> = {
  schoolId: '', nama: '', nip: '', nuptk: '', nik: '', jenisKelamin: 'L',
  jabatan: 'Guru Kelas', statusPegawai: 'PNS', statusAktif: 'Aktif',
  pendidikanTerakhir: 'S1', sertifikasi: '', nomorHp: '', email: '', keterangan: '',
};

export default function OperatorSimpeg() {
  const { user } = useAppStore();
  const [data, setData] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<EmployeeData>>({ ...defaultForm });
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!user?.schoolId) { setError('Sekolah belum ditentukan. Hubungi admin.'); setLoading(false); return; }
    try {
      const res = await fetch(`/api/firestore/employees?limit=1000&field=schoolId&value=${user.schoolId}`);
      const json = await res.json();
      setData(json.items || []);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(e => {
    if (filterJabatan !== 'Semua' && e.jabatan !== filterJabatan) return false;
    if (filterStatus !== 'Semua' && e.statusAktif !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.nama?.toLowerCase().includes(q) || e.nip?.includes(q) || e.nik?.includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...defaultForm, schoolId: user?.schoolId || '' });
    setShowForm(true);
  };

  const openEdit = (item: EmployeeData) => {
    setEditId(item.id);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.schoolId) return;
    if (form.nik && !/^\d{16}$/.test(form.nik)) { setError('NIK harus 16 digit angka'); return; }
    if (form.nip && !/^\d{18}$/.test(form.nip)) { setError('NIP harus 18 digit angka'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/firestore/employees', {
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
    if (!confirm('Nonaktifkan pegawai ini?')) return;
    try {
      await fetch(`/api/firestore/employees?id=${id}`, { method: 'DELETE' });
      setLoading(true);
      await fetchData();
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); }
  };

  if (!user) return null;

  const columns = [
    { key: 'nama', label: 'Nama', render: (r: EmployeeData) => <span className="font-medium">{r.nama}</span> },
    { key: 'nip', label: 'NIP', className: 'text-center' },
    { key: 'jabatan', label: 'Jabatan', className: 'text-center' },
    { key: 'statusPegawai', label: 'Status', className: 'text-center', render: (r: EmployeeData) => <StatusBadge status={r.statusPegawai || '-'} /> },
    { key: 'statusAktif', label: 'Aktif', className: 'text-center', render: (r: EmployeeData) => <StatusBadge status={r.statusAktif || 'Aktif'} /> },
    {
      key: 'actions', label: 'Aksi', className: 'text-center', sortable: false,
      render: (r: EmployeeData) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="SIMPEG">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <h1 className="text-lg font-bold flex items-center gap-2"><BookOpen className="w-5 h-5" /> SIMPEG</h1>
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari nama, NIP, NIK..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white" />
          </div>
          <select value={filterJabatan} onChange={e => setFilterJabatan(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Jabatan</option>
            {jabatanOptions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Pensiun">Pensiun</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
          <ExportButton collection="employees" schoolId={user?.schoolId} />
          <ImportButton collection="employees" onSuccess={() => { setLoading(true); fetchData(); }} />
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 shrink-0">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={BookOpen} message="Tidak ada data pegawai" />
        ) : (
          <DataTable columns={columns} data={filtered} keyExtractor={r => r.id} />
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{editId ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nama *</label>
                  <input value={form.nama || ''} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NIP</label>
                  <input value={form.nip || ''} onChange={e => setForm(f => ({ ...f, nip: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NUPTK</label>
                  <input value={form.nuptk || ''} onChange={e => setForm(f => ({ ...f, nuptk: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
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
                  <label className="block text-sm font-medium mb-1">Jabatan *</label>
                  <select value={form.jabatan || 'Guru Kelas'} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    {jabatanOptions.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Pegawai</label>
                  <select value={form.statusPegawai || 'PNS'} onChange={e => setForm(f => ({ ...f, statusPegawai: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="PPPK Paruh Waktu">PPPK Paruh Waktu</option>
                    <option value="Honorer">Honorer</option>
                    <option value="GTT">GTT</option>
                    <option value="GTY">GTY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Aktif</label>
                  <select value={form.statusAktif || 'Aktif'} onChange={e => setForm(f => ({ ...f, statusAktif: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="Aktif">Aktif</option>
                    <option value="Pensiun">Pensiun</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pendidikan</label>
                  <select value={form.pendidikanTerakhir || 'S1'} onChange={e => setForm(f => ({ ...f, pendidikanTerakhir: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="SMA">SMA</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sertifikasi</label>
                  <input value={form.sertifikasi || ''} onChange={e => setForm(f => ({ ...f, sertifikasi: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nomor HP</label>
                  <input value={form.nomorHp || ''} onChange={e => setForm(f => ({ ...f, nomorHp: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
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
