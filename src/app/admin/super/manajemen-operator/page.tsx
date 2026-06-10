'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { Users, LogOut, ArrowLeft, Plus, Pencil, Trash2, Search, Loader2, Shield } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { DataTable } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface OperatorUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  schoolId: string;
  schoolName: string;
  role: string;
  isActive: boolean;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export default function SuperManajemenOperator() {
  const { user } = useAppStore();
  const router = useRouter();
  const [data, setData] = useState<OperatorUser[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: '', email: '', schoolId: '', phone: '', isActive: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        fetch('/api/firestore/users'),
        fetch('/api/firestore/schools'),
      ]);
      const uJson = await uRes.json();
      const sJson = await sRes.json();
      const operators = (uJson.items || []).filter((u: any) => u.role === 'operator_sekolah');
      setData(operators);
      setSchools(sJson.items || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(u => {
    if (search) {
      const q = search.toLowerCase();
      return u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.schoolName?.toLowerCase().includes(q);
    }
    return true;
  });

  const getSchoolName = (id: string) => schools.find(s => s.id === id)?.namaSekolah || id;

  const openAdd = () => {
    setEditId(null);
    setForm({ displayName: '', email: '', schoolId: '', phone: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (item: OperatorUser) => {
    setEditId(item.id);
    setForm({
      displayName: item.displayName || '',
      email: item.email || '',
      schoolId: item.schoolId || '',
      phone: item.phone || '',
      isActive: item.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.displayName || !form.email) return;
    setSaving(true);
    try {
      const school = schools.find(s => s.id === form.schoolId);
      const res = await fetch('/api/firestore/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId || undefined,
          data: {
            ...form,
            schoolName: school?.namaSekolah || form.schoolId,
            role: 'operator_sekolah',
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
    if (!confirm('Nonaktifkan operator ini?')) return;
    try {
      await fetch(`/api/firestore/users?id=${id}`, { method: 'DELETE' });
      setLoading(true);
      await fetchData();
    } catch {}
  };

  if (!user) return null;

  const columns = [
    { key: 'displayName', label: 'Nama', render: (r: OperatorUser) => <span className="font-medium">{r.displayName}</span> },
    { key: 'email', label: 'Email' },
    { key: 'schoolName', label: 'Sekolah', render: (r: OperatorUser) => <span className="text-xs">{r.schoolName || getSchoolName(r.schoolId) || '-'}</span> },
    { key: 'phone', label: 'Telepon', className: 'text-center' },
    { key: 'isActive', label: 'Status', className: 'text-center', render: (r: OperatorUser) => <StatusBadge status={r.isActive !== false ? 'Aktif' : 'Nonaktif'} /> },
    {
      key: 'actions', label: 'Aksi', className: 'text-center', sortable: false,
      render: (r: OperatorUser) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Manajemen Operator">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5" /> Manajemen Operator</h1><p className="text-sm text-blue-200">{user.displayName} • {data.length} operator</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari nama, email, sekolah..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 shrink-0">
            <Plus className="w-4 h-4" /> Tambah Operator
          </button>
        </div>

        {loading ? <LoadingState /> : filtered.length === 0 ? (
          <EmptyState icon={Users} message="Tidak ada operator" />
        ) : (
          <DataTable columns={columns} data={filtered} keyExtractor={r => r.id} />
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">{editId ? 'Edit Operator' : 'Tambah Operator'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama *</label>
                <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sekolah</label>
                <select value={form.schoolId} onChange={e => setForm(f => ({ ...f, schoolId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                  <option value="">Pilih Sekolah</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.namaSekolah} ({s.jenjang})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telepon</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select value={form.isActive ? 'Aktif' : 'Nonaktif'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'Aktif' }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.displayName || !form.email}
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
