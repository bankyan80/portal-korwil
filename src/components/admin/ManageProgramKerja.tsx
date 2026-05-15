'use client';

import { useState } from 'react';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { AdminEmptyState } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileText, Search, Plus, Pencil, Trash2, Save, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export type ProgramStatus = 'rencana' | 'berjalan' | 'selesai' | 'ditunda';

export interface ProgramKerja {
  id: string;
  nama: string;
  deskripsi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: ProgramStatus;
  penanggungJawab: string;
  target: string;
  createdAt: number;
}

const statusConfig: Record<ProgramStatus, { label: string; className: string }> = {
  rencana: { label: 'Rencana', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  berjalan: { label: 'Berjalan', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  selesai: { label: 'Selesai', className: 'bg-green-100 text-green-700 border-green-200' },
  ditunda: { label: 'Ditunda', className: 'bg-red-100 text-red-700 border-red-200' },
};

const statusOptions: ProgramStatus[] = ['rencana', 'berjalan', 'selesai', 'ditunda'];

const defaultForm = {
  nama: '', deskripsi: '', tanggalMulai: '', tanggalSelesai: '',
  status: 'rencana' as ProgramStatus, penanggungJawab: '', target: '',
};

export function ManageProgramKerja() {
  const { items, addItem, updateItem, deleteItem } = useFirestoreCollection<ProgramKerja>('program_kerja', []);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filtered = items.filter(d =>
    !search || d.nama.toLowerCase().includes(search.toLowerCase()) || d.penanggungJawab.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditingId(null);
    setForm(defaultForm);
    setFormOpen(true);
  }

  function openEdit(item: ProgramKerja) {
    setEditingId(item.id);
    setForm({ nama: item.nama, deskripsi: item.deskripsi, tanggalMulai: item.tanggalMulai, tanggalSelesai: item.tanggalSelesai, status: item.status, penanggungJawab: item.penanggungJawab, target: item.target });
    setFormOpen(true);
  }

  async function save() {
    if (!form.nama.trim() || !form.tanggalMulai.trim()) return;
    if (editingId) {
      await updateItem(editingId, form);
    } else {
      await addItem({ ...form, createdAt: Date.now() });
    }
    setFormOpen(false);
    setForm(defaultForm);
  }

  async function handleDelete(id: string) {
    await deleteItem(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari program kerja..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
          <Plus className="w-4 h-4" /> Tambah Program
        </Button>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState icon={FileText} title="Belum ada program kerja" description="Program kerja belum ditambahkan" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const sc = statusConfig[item.status];
            return (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{item.nama}</h3>
                        <Badge className={`${sc.className} text-[10px] border-0`}>
                          {item.status === 'selesai' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {item.status === 'berjalan' && <Clock className="w-3 h-3 mr-1" />}
                          {item.status === 'ditunda' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {sc.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.deskripsi}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span>{item.tanggalMulai} – {item.tanggalSelesai}</span>
                        {item.penanggungJawab && <span>PJ: {item.penanggungJawab}</span>}
                        {item.target && <span>Sasaran: {item.target}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Program Kerja' : 'Tambah Program Kerja'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama Program</Label>
              <Input value={form.nama} onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.deskripsi} onChange={(e) => setForm(f => ({ ...f, deskripsi: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input type="date" value={form.tanggalMulai} onChange={(e) => setForm(f => ({ ...f, tanggalMulai: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input type="date" value={form.tanggalSelesai} onChange={(e) => setForm(f => ({ ...f, tanggalSelesai: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as ProgramStatus }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {statusOptions.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Penanggung Jawab</Label>
                <Input value={form.penanggungJawab} onChange={(e) => setForm(f => ({ ...f, penanggungJawab: e.target.value }))} placeholder="Nama/PJ" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target / Sasaran</Label>
              <Input value={form.target} onChange={(e) => setForm(f => ({ ...f, target: e.target.value }))} placeholder="Sasaran program" />
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
