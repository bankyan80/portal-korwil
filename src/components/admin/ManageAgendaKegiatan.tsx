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
import { CalendarDays, Search, Plus, Pencil, Trash2, Save, Clock, MapPin } from 'lucide-react';
import type { CalendarEvent } from '@/types';

const typeOptions = [
  { value: 'academic', label: 'Akademik' },
  { value: 'holiday', label: 'Libur' },
  { value: 'meeting', label: 'Rapat' },
  { value: 'exam', label: 'Ujian' },
  { value: 'other', label: 'Lainnya' },
];

const typeColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  holiday: 'bg-green-100 text-green-700',
  meeting: 'bg-purple-100 text-purple-700',
  exam: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-700',
};

const defaultForm = { title: '', description: '', tanggal: '', waktu: '', lokasi: '', type: 'academic' as CalendarEvent['type'] };

const defaultData: CalendarEvent[] = [
  { id: '1', title: 'Hari Pertama Masuk Sekolah', description: 'Hari pertama masuk sekolah TP 2025/2026', tanggal: '14 Juli 2025', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() },
  { id: '2', title: 'MPLS', description: 'Masa Pengenalan Lingkungan Sekolah', tanggal: '14-18 Juli 2025', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 86400000 },
  { id: '3', title: 'HUT Kemerdekaan RI', description: 'Libur Nasional', tanggal: '17 Agustus 2025', lokasi: '-', type: 'holiday', organizerName: 'Admin', createdAt: Date.now() - 172800000 },
  { id: '4', title: 'Asesmen Nasional SMP', description: 'Pelaksanaan AN SMP/Paket B', tanggal: '25-28 Agustus 2025', lokasi: 'SMP', type: 'exam', organizerName: 'Admin', createdAt: Date.now() - 259200000 },
];

export function ManageAgendaKegiatan() {
  const { items, addItem, updateItem, deleteItem } = useFirestoreCollection<CalendarEvent>('calendar_events', defaultData);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filtered = items.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.tanggal.includes(search)
  );

  function openAdd() {
    setEditingId(null);
    setForm(defaultForm);
    setFormOpen(true);
  }

  function openEdit(item: CalendarEvent) {
    setEditingId(item.id || null);
    setForm({ title: item.title, description: item.description, tanggal: item.tanggal, waktu: item.waktu || '', lokasi: item.lokasi || '', type: item.type });
    setFormOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.tanggal.trim()) return;
    if (editingId) {
      await updateItem(editingId, form);
    } else {
      await addItem({ ...form, organizerName: 'Admin', createdAt: Date.now() });
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
          <Input placeholder="Cari agenda..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
          <Plus className="w-4 h-4" /> Tambah Agenda
        </Button>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState icon={CalendarDays} title="Belum ada agenda" description="Agenda kegiatan belum ditambahkan" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="bg-blue-800 text-white px-5 py-3 sm:w-48 shrink-0 flex sm:flex-col items-center sm:items-start justify-center sm:justify-center gap-1">
                  <CalendarDays className="w-5 h-5 sm:mb-1" />
                  <p className="text-sm font-semibold text-center sm:text-left leading-tight">{item.tanggal}</p>
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <Badge className={`${typeColors[item.type] || typeColors.other} text-[10px] border-0`}>
                          {typeOptions.find(t => t.value === item.type)?.label || item.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {item.waktu && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {item.waktu}</p>}
                        {item.lokasi && item.lokasi !== '-' && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.lokasi}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(item)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(item.id!)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Agenda' : 'Tambah Agenda'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input value={form.tanggal} onChange={(e) => setForm(f => ({ ...f, tanggal: e.target.value }))} placeholder="Contoh: 14 Juli 2025 atau 14-18 Juli 2025" />
            </div>
            <div className="space-y-2">
              <Label>Nama Kegiatan</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe</Label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Waktu <span className="text-xs text-muted-foreground">(opsional)</span></Label>
                <Input value={form.waktu} onChange={(e) => setForm(f => ({ ...f, waktu: e.target.value }))} placeholder="08:00 - 12:00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Lokasi</Label>
              <Input value={form.lokasi} onChange={(e) => setForm(f => ({ ...f, lokasi: e.target.value }))} placeholder="Lokasi kegiatan" />
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
