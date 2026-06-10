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

interface EmployeeData {
  id: string;
  schoolId: string;
  nama: string;
  nip: string;
  nuptk: string;
  nik: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  statusPegawai: string;
  jabatan: string;
  pangkatGolongan: string;
  tmtKerja: string;
  tmtJabatan: string;
  pendidikanTerakhir: string;
  sertifikasi: string;
  nomorHp: string;
  email: string;
  statusAktif: string;
  keterangan: string;
  jenjang: string;
  namaSekolah: string;
  createdAt: string;
  updatedAt: string;
}

const jabatanOptions = [
  'Kepala Sekolah', 'Kepala TK', 'Kepala KB',
  'Guru Kelas', 'Guru PAI', 'Guru PJOK', 'Guru Mapel',
  'Guru TK', 'Pendidik TK', 'Pendidik KB',
  'Tendik', 'Operator',
];

const defaultForm: Partial<EmployeeData> = {
  schoolId: '', nama: '', nip: '', nuptk: '', nik: '', jenisKelamin: 'L',
  tempatLahir: '', tanggalLahir: '', statusPegawai: 'PNS',
  jabatan: 'Guru Kelas', pangkatGolongan: '', tmtKerja: '', tmtJabatan: '',
  pendidikanTerakhir: 'S1', sertifikasi: '', nomorHp: '', email: '',
  statusAktif: 'Aktif', keterangan: '', jenjang: 'SD', namaSekolah: '',
};

export default function SuperSimpeg() {
  const { user } = useAppStore();
  const [data, setData] = useState<EmployeeData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterSchool, setFilterSchool] = useState('Semua');
  const [filterJabatan, setFilterJabatan] = useState('Semua');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<EmployeeData>>({ ...defaultForm });
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [eRes, scRes] = await Promise.all([
        fetch('/api/firestore/employees?limit=1000'),
        fetch('/api/firestore/schools'),
      ]);
      const eJson = await eRes.json();
      const scJson = await scRes.json();
      setData(eJson.items || []);
      setTotalCount(eJson.total || 0);
      setSchools(scJson.items || []);
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSchoolName = (schoolId: string) => schools.find(s => s.id === schoolId)?.namaSekolah || schoolId;
  const getSchoolJenjang = (schoolId: string) => schools.find(s => s.id === schoolId)?.jenjang || '';
  const getSchoolStatus = (schoolId: string) => schools.find(s => s.id === schoolId)?.statusSekolah || '';

  const filtered = data.filter(e => {
    const sJenjang = getSchoolJenjang(e.schoolId);
    const sStatus = getSchoolStatus(e.schoolId);
    if (filterJenjang !== 'Semua' && sJenjang !== filterJenjang) return false;
    if (filterStatus !== 'Semua' && sStatus !== filterStatus) return false;
    if (filterSchool !== 'Semua' && e.schoolId !== filterSchool) return false;
    if (filterJabatan !== 'Semua' && e.jabatan !== filterJabatan) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.nama?.toLowerCase().includes(q) || e.nip?.includes(q) || e.nik?.includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...defaultForm });
    setShowForm(true);
  };

  const openEdit = (item: EmployeeData) => {
    setEditId(item.id);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.schoolId || !form.jabatan) return;
    setSaving(true);
    try {
      const school = schools.find(s => s.id === form.schoolId);
      const res = await fetch('/api/firestore/employees', {
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
    { key: 'sekolah', label: 'Sekolah', className: 'text-center', render: (r: EmployeeData) => <span className="text-xs">{getSchoolName(r.schoolId)}</span> },
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
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="SIMPEG">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen className="w-5 h-5" /> SIMPEG</h1>
        <p className="text-sm text-blue-200">{user.displayName || ''} • {totalCount} pegawai</p>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
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
          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Jenjang</option>
            <option value="SD">SD</option>
            <option value="TK">TK</option>
            <option value="KB">KB</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Negeri/Swasta</option>
            <option value="Negeri">Negeri</option>
            <option value="Swasta">Swasta</option>
          </select>
          <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Sekolah</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.namaSekolah}</option>)}
          </select>
          <select value={filterJabatan} onChange={e => setFilterJabatan(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white">
            <option value="Semua">Semua Jabatan</option>
            {jabatanOptions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <ExportButton collection="employees" />
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{editId ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
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
                    <option value="Mutasi">Mutasi</option>
                    <option value="Meninggal">Meninggal</option>
                    <option value="Keluar">Keluar</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pendidikan Terakhir</label>
                  <select value={form.pendidikanTerakhir || 'S1'} onChange={e => setForm(f => ({ ...f, pendidikanTerakhir: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="SMA">SMA</option>
                    <option value="D1">D1</option>
                    <option value="D2">D2</option>
                    <option value="D3">D3</option>
                    <option value="D4">D4</option>
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
                  <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
                  <input value={form.tempatLahir || ''} onChange={e => setForm(f => ({ ...f, tempatLahir: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                  <input type="date" value={form.tanggalLahir || ''} onChange={e => setForm(f => ({ ...f, tanggalLahir: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pangkat/Gol</label>
                  <input value={form.pangkatGolongan || ''} onChange={e => setForm(f => ({ ...f, pangkatGolongan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TMT Kerja</label>
                  <input type="date" value={form.tmtKerja || ''} onChange={e => setForm(f => ({ ...f, tmtKerja: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
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
                  <textarea value={form.keterangan || ''} onChange={e => setForm(f => ({ ...f, keterangan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.nama || !form.schoolId || !form.jabatan}
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
