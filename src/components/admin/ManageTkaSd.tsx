'use client';

import { useState, useMemo } from 'react';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  FileBarChart, Search, Plus, Pencil, Trash2, Save, Loader2, Award, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminEmptyState } from '@/components/shared/AdminTable';

interface TkaParticipant {
  id: string;
  nama: string;
  nik: string;
  sekolah: string;
  kelas: string;
  tglTes: string;
  nilaiMatematika: number;
  nilaiIndo: number;
  nilaiIpa: number;
  rataRata: number;
  status: string;
}

const defaultForm = {
  nama: '', nik: '', sekolah: '', kelas: '6', tglTes: '',
  nilaiMatematika: 0, nilaiIndo: 0, nilaiIpa: 0,
  status: 'Selesai'
};

export function ManageTkaSd() {
  const { user } = useAppStore();
  const { items, addItem, updateItem, deleteItem, loading } = useFirestoreCollection<TkaParticipant>('tka_sd');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const isOperator = user?.role === 'operator_sekolah';
  const userSchool = user?.schoolName || '';

  const filtered = useMemo(() => {
    return items.filter((d) => {
      if (isOperator && d.sekolah !== userSchool) return false;
      if (search && !d.nama.toLowerCase().includes(search.toLowerCase()) && !d.nik.includes(search)) return false;
      return true;
    });
  }, [items, search, isOperator, userSchool]);

  const stats = useMemo(() => ({
    total: filtered.length,
    rataRata: filtered.length > 0 ? (filtered.reduce((a, b) => a + (b.rataRata || 0), 0) / filtered.length).toFixed(2) : 0
  }), [filtered]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ ...defaultForm, sekolah: userSchool });
    setFormOpen(true);
  };

  const handleOpenEdit = (item: TkaParticipant) => {
    setEditingId(item.id);
    setForm({ ...item });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.nik || !form.sekolah) {
      toast.error('Mohon isi data wajib');
      return;
    }
    
    const rataRata = Number(((Number(form.nilaiMatematika) + Number(form.nilaiIndo) + Number(form.nilaiIpa)) / 3).toFixed(2));
    const payload = { ...form, rataRata };

    setSaving(true);
    try {
      if (editingId) await updateItem(editingId, payload);
      else await addItem(payload);
      setFormOpen(false);
    } catch {
      toast.error('Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Peserta</p><p className="text-3xl font-bold mt-1 text-[#0d3b66] dark:text-white">{stats.total}</p></div>
            <FileBarChart className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Rata-rata Wilayah</p><p className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{stats.rataRata}</p></div>
            <Award className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari nama atau NIK..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-initial"><Download className="w-4 h-4" /> Ekspor</Button>
          <Button onClick={handleOpenAdd} className="bg-blue-800 hover:bg-blue-900 gap-2 flex-1 sm:flex-initial"><Plus className="w-4 h-4" /> Tambah</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <AdminEmptyState icon={FileBarChart} title="Belum ada data TKA" description="Data nilai kompetensi akademik belum ditambahkan" />
      ) : (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Nama</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-400">Sekolah</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400">MTK</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400">IND</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400">IPA</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400">Rata-rata</th>
                  <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#0d3b66] dark:text-white">{item.nama}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{item.nik}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{item.sekolah}</td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-600">{item.nilaiMatematika}</td>
                    <td className="px-4 py-3 text-center font-semibold text-green-600">{item.nilaiIndo}</td>
                    <td className="px-4 py-3 text-center font-semibold text-purple-600">{item.nilaiIpa}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">{item.rataRata}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteItem(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Nilai TKA' : 'Input Nilai TKA'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>NIK</Label>
              <Input value={form.nik} onChange={(e) => setForm({...form, nik: e.target.value.replace(/\D/g, '').slice(0, 16)})} placeholder="16 digit NIK" />
            </div>
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} placeholder="Nama Siswa" />
            </div>
            {!isOperator && (
              <div className="grid gap-2">
                <Label>Sekolah</Label>
                <Input value={form.sekolah} onChange={(e) => setForm({...form, sekolah: e.target.value})} placeholder="Nama Sekolah" />
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>MTK</Label>
                <Input type="number" value={form.nilaiMatematika} onChange={(e) => setForm({...form, nilaiMatematika: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label>B. IND</Label>
                <Input type="number" value={form.nilaiIndo} onChange={(e) => setForm({...form, nilaiIndo: Number(e.target.value)})} />
              </div>
              <div className="grid gap-2">
                <Label>IPA</Label>
                <Input type="number" value={form.nilaiIpa} onChange={(e) => setForm({...form, nilaiIpa: Number(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Nilai
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
