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
import { JenjangBadge } from '@/components/shared/JenjangBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface StudentData {
  id: string;
  schoolId: string;
  tahunPelajaran: string;
  nisn: string;
  nik: string;
  nama: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  agama: string;
  alamat: string;
  namaAyah: string;
  namaIbu: string;
  kelas: string;
  kelompok: string;
  rombel: string;
  statusSiswa: string;
  tanggalMasuk: string;
  tanggalKeluar: string;
  keterangan: string;
  jenjang: string;
  namaSekolah: string;
  createdAt: string;
  updatedAt: string;
}

const defaultForm: Partial<StudentData> = {
  schoolId: '', tahunPelajaran: String(new Date().getFullYear()),
  nisn: '', nik: '', nama: '', jenisKelamin: 'L',
  tempatLahir: '', tanggalLahir: '', agama: 'Islam',
  alamat: '', namaAyah: '', namaIbu: '',
  kelas: '', kelompok: '', rombel: '',
  statusSiswa: 'Aktif', tanggalMasuk: '', tanggalKeluar: '',
  keterangan: '', jenjang: 'SD', namaSekolah: '',
};

export default function SuperSimdawa() {
  const { user } = useAppStore();
  const [data, setData] = useState<StudentData[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterSchool, setFilterSchool] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<StudentData>>({ ...defaultForm });
  const [statusFilter, setStatusFilter] = useState('Semua');

  const fetchData = useCallback(async () => {
    try {
      const [sRes, scRes] = await Promise.all([
        fetch('/api/firestore/students'),
        fetch('/api/firestore/schools'),
      ]);
      const sJson = await sRes.json();
      const scJson = await scRes.json();
      setData(sJson.items || []);
      setSchools(scJson.items || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSchoolName = (schoolId: string) => schools.find(s => s.id === schoolId)?.namaSekolah || schoolId;
  const getSchoolJenjang = (schoolId: string) => schools.find(s => s.id === schoolId)?.jenjang || '';
  const getSchoolStatus = (schoolId: string) => schools.find(s => s.id === schoolId)?.statusSekolah || '';

  const filtered = data.filter(s => {
    const sJenjang = getSchoolJenjang(s.schoolId);
    const sStatus = getSchoolStatus(s.schoolId);
    if (filterJenjang !== 'Semua' && sJenjang !== filterJenjang) return false;
    if (statusFilter !== 'Semua' && sStatus !== statusFilter) return false;
    if (filterStatus !== 'Semua' && s.statusSiswa !== filterStatus) return false;
    if (filterSchool !== 'Semua' && s.schoolId !== filterSchool) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.nama?.toLowerCase().includes(q) || s.nisn?.includes(q) || s.nik?.includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...defaultForm, tahunPelajaran: String(new Date().getFullYear()) });
    setShowForm(true);
  };

  const openEdit = (item: StudentData) => {
    setEditId(item.id);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.schoolId) return;
    setSaving(true);
    try {
      const school = schools.find(s => s.id === form.schoolId);
      const res = await fetch('/api/firestore/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId || undefined,
          data: {
            ...form,
            jenjang: school?.jenjang || form.jenjang,
            namaSekolah: school?.namaSekolah || form.namaSekolah,
            updatedAt: new Date().toISOString(),
          },
          merge: true,
        }),
      });
      const json = await res.json();
      if (json.success || json.data) {
        setShowForm(false);
        setLoading(true);
        await fetchData();
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data siswa ini?')) return;
    try {
      await fetch(`/api/firestore/students?id=${id}`, { method: 'DELETE' });
      setLoading(true);
      await fetchData();
    } catch {}
  };

  if (!user) return null;

  const sdCount = data.filter(s => getSchoolJenjang(s.schoolId) === 'SD').length;
  const tkCount = data.filter(s => getSchoolJenjang(s.schoolId) === 'TK').length;
  const kbCount = data.filter(s => getSchoolJenjang(s.schoolId) === 'KB').length;

  const columns = [
    { key: 'nama', label: 'Nama', render: (r: StudentData) => <span className="font-medium">{r.nama}</span> },
    { key: 'nisn', label: 'NISN', className: 'text-center' },
    { key: 'nik', label: 'NIK', className: 'text-center' },
    { key: 'jenisKelamin', label: 'L/P', className: 'text-center' },
    { key: 'kelas', label: 'Kelas', className: 'text-center', render: (r: StudentData) => r.kelas || r.kelompok || '-' },
    { key: 'sekolah', label: 'Sekolah', className: 'text-center', render: (r: StudentData) => <span className="text-xs">{getSchoolName(r.schoolId)}</span> },
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
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="SIMDAWA">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5" /> SIMDAWA</h1>
        <p className="text-sm text-blue-200">{user.displayName} • {data.length} siswa</p>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold">{data.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold text-blue-700">{sdCount}</p><p className="text-xs text-muted-foreground">SD</p></div>
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold text-purple-700">{tkCount}</p><p className="text-xs text-muted-foreground">TK</p></div>
          <div className="bg-white rounded-xl border p-3 text-center"><p className="text-xl font-bold text-green-700">{kbCount}</p><p className="text-xs text-muted-foreground">KB</p></div>
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
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Negeri/Swasta</option>
            <option value="Negeri">Negeri</option>
            <option value="Swasta">Swasta</option>
          </select>
          <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Sekolah</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.namaSekolah}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Siswa Baru">Siswa Baru</option>
            <option value="Mutasi Masuk">Mutasi Masuk</option>
            <option value="Mutasi Keluar">Mutasi Keluar</option>
            <option value="Lulus/Alumni">Lulus/Alumni</option>
          </select>
          <ExportButton collection="students" />
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{editId ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Sekolah *</label>
                  <select value={form.schoolId || ''} onChange={e => {
                    const school = schools.find(s => s.id === e.target.value);
                    setForm(f => ({ ...f, schoolId: e.target.value, jenjang: school?.jenjang || f.jenjang, namaSekolah: school?.namaSekolah || '' }));
                  }} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="">Pilih Sekolah</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.namaSekolah} ({s.jenjang})</option>)}
                  </select>
                </div>
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
                  <label className="block text-sm font-medium mb-1">Agama</label>
                  <select value={form.agama || 'Islam'} onChange={e => setForm(f => ({ ...f, agama: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tahun Pelajaran</label>
                  <input value={form.tahunPelajaran || ''} onChange={e => setForm(f => ({ ...f, tahunPelajaran: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="2025/2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Siswa</label>
                  <select value={form.statusSiswa || 'Aktif'} onChange={e => setForm(f => ({ ...f, statusSiswa: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="Aktif">Aktif</option>
                    <option value="Siswa Baru">Siswa Baru</option>
                    <option value="Mutasi Masuk">Mutasi Masuk</option>
                    <option value="Mutasi Keluar">Mutasi Keluar</option>
                    <option value="Keluar">Keluar</option>
                    <option value="Lulus/Alumni">Lulus/Alumni</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kelas/Kelompok</label>
                  <input value={form.kelas || form.kelompok || ''} onChange={e => setForm(f => ({ ...f, kelas: e.target.value, kelompok: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" placeholder="I/II/III/A/B" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rombel</label>
                  <input value={form.rombel || ''} onChange={e => setForm(f => ({ ...f, rombel: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
                  <input value={form.tempatLahir || ''} onChange={e => setForm(f => ({ ...f, tempatLahir: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                  <input type="date" value={form.tanggalLahir || ''} onChange={e => setForm(f => ({ ...f, tanggalLahir: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Alamat</label>
                  <textarea value={form.alamat || ''} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} />
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
                  <label className="block text-sm font-medium mb-1">Keterangan</label>
                  <textarea value={form.keterangan || ''} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.nama || !form.schoolId}
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
