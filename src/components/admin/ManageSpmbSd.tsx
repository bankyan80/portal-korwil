'use client';

import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { useAppStore } from '@/store/app-store';
import { AdminEmptyState } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, query, where, onSnapshot, doc, setDoc,
} from 'firebase/firestore';
import {
  FileText, Users, CheckCircle, Clock, XCircle, Search,
  Plus, Pencil, Trash2, Save,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Pendaftar {
  id: string;
  nama: string;
  nik: string;
  jalur: string;
  usia: number;
  status: string;
  tglDaftar: string;
  sekolah: string;
}

const statusOptions = ['Menunggu Verifikasi', 'Diverifikasi', 'Valid', 'Cadangan', 'Ditolak'];

const statusColor: Record<string, string> = {
  Diverifikasi: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Menunggu Verifikasi': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Valid: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Ditolak: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Cadangan: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

const defaultForm = { nama: '', nik: '', jalur: 'Domisili', usia: 6, status: 'Menunggu Verifikasi' as string, tglDaftar: new Date().toISOString().split('T')[0], sekolah: '' };

const defaultData: Pendaftar[] = [
  { id: '1', nama: 'Ahmad Fauzan', nik: '3209071234567890', jalur: 'Domisili', usia: 7, status: 'Diverifikasi', tglDaftar: '2025-06-01', sekolah: 'SD NEGERI 1 LEMAHABANG' },
  { id: '2', nama: 'Siti Nurhaliza', nik: '3209071234567891', jalur: 'Afirmasi', usia: 6, status: 'Menunggu Verifikasi', tglDaftar: '2025-06-02', sekolah: 'SD NEGERI 1 LEMAHABANG' },
  { id: '3', nama: 'Rudi Hartono', nik: '3209071234567892', jalur: 'Mutasi', usia: 8, status: 'Valid', tglDaftar: '2025-06-03', sekolah: 'SD NEGERI 2 BELAWA' },
  { id: '4', nama: 'Dewi Lestari', nik: '3209071234567893', jalur: 'Domisili', usia: 6, status: 'Ditolak', tglDaftar: '2025-06-04', sekolah: 'SD NEGERI 1 LEMAHABANG' },
];

const acceptedStatuses = ['Diverifikasi', 'Valid'];

async function autoAddToDataPd(p: Pendaftar) {
  if (!db) return;
  const q = query(collection(db, 'students'), where('nik', '==', p.nik));

  let alreadyExists = false;
  const checkSub = onSnapshot(q, (snap) => {
    if (!snap.empty && !alreadyExists) {
      alreadyExists = true;
      checkSub();
    }
  });

  // Wait up to 2s for realtime check; if not resolved, proceed to add (belt-and-suspenders)
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      if (!alreadyExists) {
        alreadyExists = true;
        resolve();
      }
    }, 2000);
    // Resolve early if alreadyExists flips
    const iv = setInterval(() => {
      if (alreadyExists) { clearInterval(iv); resolve(); }
    }, 50);
  });
  (checkSub as any)?.();
  if (alreadyExists) return;

  await addDoc(collection(db, 'students'), {
    nik: p.nik, nama: p.nama, jk: '', nisn: '', tanggal_lahir: '',
    sekolah: p.sekolah, schoolId: '', jenjang: 'SD', kelas: 1, desa: '',
    alasan: `Auto dari SPMB - ${p.jalur}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export function ManageSpmbSd() {
  const { user } = useAppStore();
  const { items, addItem, updateItem, deleteItem } = useFirestoreCollection<Pendaftar>('spmb_sd', defaultData);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';

  const filtered = items.filter((d) => {
    if (isOperator && userSchool && !d.sekolah.toLowerCase().includes(userSchool.toLowerCase())) return false;
    if (search && !d.nama.toLowerCase().includes(search.toLowerCase()) && !d.nik.includes(search)) return false;
    return true;
  });

  const counts = {
    total: filtered.length,
    diterima: filtered.filter(d => d.status === 'Diverifikasi' || d.status === 'Valid').length,
    cadangan: filtered.filter(d => d.status === 'Cadangan').length,
    ditolak: filtered.filter(d => d.status === 'Ditolak').length,
  };

  function openAdd() {
    setEditingId(null);
    setForm({ ...defaultForm, sekolah: userSchool || '' });
    setFormOpen(true);
  }

  function openEdit(item: Pendaftar) {
    setEditingId(item.id);
    setForm({ nama: item.nama, nik: item.nik, jalur: item.jalur, usia: item.usia, status: item.status, tglDaftar: item.tglDaftar, sekolah: item.sekolah });
    setFormOpen(true);
  }

  async function save() {
    if (!form.nama.trim() || !form.nik.trim()) return;
    if (editingId) {
      await updateItem(editingId, form);
      if (acceptedStatuses.includes(form.status)) {
        const original = items.find(i => i.id === editingId);
        if (original) await autoAddToDataPd({ ...original, ...form });
      }
    } else {
      await addItem(form);
      if (acceptedStatuses.includes(form.status)) {
        await autoAddToDataPd({ id: '', ...form });
      }
    }
    setFormOpen(false);
    setForm(defaultForm);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Pendaftar', value: counts.total, icon: Users, color: 'text-blue-600' },
          { label: 'Diterima', value: counts.diterima, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Cadangan', value: counts.cadangan, icon: Clock, color: 'text-orange-600' },
          { label: 'Ditolak', value: counts.ditolak, icon: XCircle, color: 'text-red-600' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{item.value}</p></div>
                <Icon className={`w-8 h-8 opacity-30 ${item.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari pendaftar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2"><Plus className="w-4 h-4" /> Tambah</Button>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState icon={FileText} title="Belum ada pendaftar" description="Data pendaftar SPMB belum ditambahkan" />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">NIK</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Usia</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((d, i) => (
                  <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{d.nama}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{d.nik}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{d.usia} thn</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-[11px] font-medium rounded-full ${statusColor[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(d)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteItem(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Pendaftar' : 'Tambah Pendaftar'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={form.nama} onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))} /></div>
            <div className="space-y-2"><Label>NIK</Label><Input value={form.nik} onChange={(e) => setForm(f => ({ ...f, nik: e.target.value }))} maxLength={16} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jalur</Label>
                <select value={form.jalur} onChange={(e) => setForm(f => ({ ...f, jalur: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  <option value="Domisili">Domisili</option><option value="Afirmasi">Afirmasi</option>
                  <option value="Mutasi">Mutasi</option><option value="Prestasi">Prestasi</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Usia</Label><Input type="number" min={5} max={12} value={form.usia} onChange={(e) => setForm(f => ({ ...f, usia: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label>Sekolah Tujuan</Label><Input value={form.sekolah} onChange={(e) => setForm(f => ({ ...f, sekolah: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select value={form.status} onChange={(e) => {
                const newStatus = e.target.value;
                setForm(f => ({ ...f, status: newStatus }));
              }}
                className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {acceptedStatuses.includes(form.status) && (
                <p className="text-xs text-green-600 mt-1">Status diterima: siswa otomatis masuk Data PD Kelas 1</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              <Save className="w-4 h-4" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
