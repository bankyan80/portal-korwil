'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { ArrowLeft, School, Plus, Pencil, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SekolahForm {
  name: string;
  npsn: string;
  jenjang: string;
  status: string;
  desa: string;
  alamat: string;
  kepalaSekolah: string;
  kontak: string;
  akreditasi: string;
  website: string;
}

const defaultForm: SekolahForm = {
  name: '', npsn: '', jenjang: '', status: '', desa: '',
  alamat: '', kepalaSekolah: '', kontak: '', akreditasi: '', website: '',
};

export function SuperSekolah() {
  const { user, setCurrentView } = useAppStore();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SekolahForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  async function loadSchools() {
    if (!db) { setLoading(false); return; }
    try {
      const snap = await getDocs(collection(db!, 'schools'));
      setSchools(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(defaultForm);
    setFormOpen(true);
  }

  function openEdit(s: any) {
    setEditingId(s.id);
    setForm({
      name: s.name || '', npsn: s.npsn || '', jenjang: s.jenjang || '',
      status: s.status || '', desa: s.desa || '', alamat: s.alamat || '',
      kepalaSekolah: s.kepalaSekolah || '', kontak: s.kontak || '',
      akreditasi: s.akreditasi || '', website: s.website || '',
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !db) return;
    setSaving(true);
    try {
      const id = editingId || `school-${Date.now()}`;
      await setDoc(doc(db!, 'schools', id), { ...form, updatedAt: Date.now() }, { merge: true });
      toast.success(editingId ? 'Sekolah berhasil diperbarui' : 'Sekolah berhasil ditambahkan');
      setFormOpen(false);
      await loadSchools();
    } catch {
      toast.error('Gagal menyimpan');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentView('super-dashboard')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Data Sekolah</h1>
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
          <Plus className="w-4 h-4" /> Tambah Sekolah
        </Button>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama Sekolah</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jenjang</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NPSN</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Desa</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
              </tr></thead>
              <tbody className="divide-y">
                {schools.map(s => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{s.name || s.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.jenjang}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.npsn || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.desa || s.alamat || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(s)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {schools.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada data sekolah</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Sekolah' : 'Tambah Sekolah'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Sekolah</Label>
              <Input value={form.name} onChange={(e: any) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NPSN</Label>
                <Input value={form.npsn} onChange={(e: any) => setForm(f => ({ ...f, npsn: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Jenjang</Label>
                <select value={form.jenjang} onChange={(e: any) => setForm(f => ({ ...f, jenjang: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  <option value="">Pilih</option>
                  <option value="SD">SD</option>
                  <option value="TK">TK</option>
                  <option value="KB">KB</option>
                  <option value="PAUD">PAUD</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={(e: any) => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  <option value="">Pilih</option>
                  <option value="NEGERI">NEGERI</option>
                  <option value="SWASTA">SWASTA</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Desa</Label>
                <Input value={form.desa} onChange={(e: any) => setForm(f => ({ ...f, desa: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input value={form.alamat} onChange={(e: any) => setForm(f => ({ ...f, alamat: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kepala Sekolah</Label>
                <Input value={form.kepalaSekolah} onChange={(e: any) => setForm(f => ({ ...f, kepalaSekolah: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Akreditasi</Label>
                <Input value={form.akreditasi} onChange={(e: any) => setForm(f => ({ ...f, akreditasi: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kontak</Label>
                <Input value={form.kontak} onChange={(e: any) => setForm(f => ({ ...f, kontak: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={(e: any) => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="bg-blue-800 hover:bg-blue-900 text-white" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
