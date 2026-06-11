'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { School, Pencil, Loader2, Save } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorProfilSekolah() {
  const { user } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!user?.schoolId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/firestore/schools?id=${user.schoolId}`);
      const json = await res.json();
      setData(json.data || null);
      setForm(json.data || {});
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.schoolId]);

  const handleSave = async () => {
    if (!user?.schoolId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/firestore/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.schoolId,
          data: { ...form, updatedAt: new Date().toISOString() },
          merge: true,
        }),
      });
      const json = await res.json();
      if (json.success || json.data) {
        setData({ ...form });
        setEditing(false);
      }
    } catch (e: any) { setError(e.message || 'Terjadi kesalahan'); } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Profil Sekolah">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-3xl mx-auto space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2"><School className="w-5 h-5" /> Profil Sekolah/Lembaga</h1>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-white">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : data ? (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nama Sekolah</label>
                  <input value={form.namaSekolah || ''} onChange={e => setForm(f => ({ ...f, namaSekolah: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">NPSN</label>
                  <input value={form.npsn || ''} onChange={e => setForm(f => ({ ...f, npsn: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenjang</label>
                  <input value={form.jenjang || ''} className="w-full px-3 py-2 rounded-lg border text-sm bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Sekolah</label>
                  <select value={form.statusSekolah || ''} onChange={e => setForm(f => ({ ...f, statusSekolah: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="Negeri">Negeri</option>
                    <option value="Swasta">Swasta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bentuk Satuan</label>
                  <input value={form.bentukSatuan || ''} onChange={e => setForm(f => ({ ...f, bentukSatuan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Alamat</label>
                  <textarea value={form.alamat || ''} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Desa</label>
                  <input value={form.desa || ''} onChange={e => setForm(f => ({ ...f, desa: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kecamatan</label>
                  <input value={form.kecamatan || 'Lemahabang'} onChange={e => setForm(f => ({ ...f, kecamatan: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah Rombel</label>
                  <input type="number" value={form.jumlahRombel ?? ''} onChange={e => setForm(f => ({ ...f, jumlahRombel: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status Aktif</label>
                  <select value={form.isActive !== false ? 'Aktif' : 'Nonaktif'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'Aktif' }))} className="w-full px-3 py-2 rounded-lg border text-sm">
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-xl">{data.namaSekolah || '-'}</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">NPSN:</span> <span className="font-medium">{data.npsn || '-'}</span></div>
                  <div><span className="text-muted-foreground">Jenjang:</span> <span className="font-medium">{data.jenjang || '-'}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{data.statusSekolah || '-'}</span></div>
                  <div><span className="text-muted-foreground">Bentuk Satuan:</span> <span className="font-medium">{data.bentukSatuan || '-'}</span></div>
                  <div><span className="text-muted-foreground">Alamat:</span> <span className="font-medium">{data.alamat || '-'}</span></div>
                  <div><span className="text-muted-foreground">Desa:</span> <span className="font-medium">{data.desa || '-'}</span></div>
                  <div><span className="text-muted-foreground">Kecamatan:</span> <span className="font-medium">{data.kecamatan || 'Lemahabang'}</span></div>
                  <div><span className="text-muted-foreground">Rombel:</span> <span className="font-medium">{data.jumlahRombel || '-'}</span></div>
                </div>
                {data.kepalaSekolah && (
                  <div className="border-t pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Kepala Sekolah</h3>
                    <p className="font-medium">{data.kepalaSekolah}</p>
                    {data.nipKepalaSekolah && <p className="text-xs text-muted-foreground">NIP: {data.nipKepalaSekolah}</p>}
                  </div>
                )}
                <div className="border-t pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Data Satuan Pendidikan</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{data.jumlahSiswa ?? '-'}</p>
                      <p className="text-[10px] text-blue-600">Siswa</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{data.jumlahGuru ?? '-'}</p>
                      <p className="text-[10px] text-green-600">Guru</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-purple-700">{data.jumlahTendik ?? '-'}</p>
                      <p className="text-[10px] text-purple-600">Tendik</p>
                    </div>
                  </div>
                </div>
              </>
            )}
            {editing && (
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setEditing(false); setForm(data); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Batal</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" /> Simpan
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Data sekolah belum tersedia.</p>
        )}
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
