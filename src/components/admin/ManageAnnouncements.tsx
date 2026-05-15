'use client';

import { useState, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Bell, Pin, Clock, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Announcement } from '@/types';
import { useAnnouncementsCrud } from '@/hooks/use-firestore-crud';
import { AdminToolbar, AdminEmptyState, AdminDeleteDialog, AdminTableSkeleton } from '@/components/shared/AdminTable';

interface AnnouncementFormData { title: string; content: string; pinned: boolean; }
const defaultForm: AnnouncementFormData = { title: '', content: '', pinned: false };

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));

export function ManageAnnouncements() {
  const crud = useAnnouncementsCrud();
  const [form, setForm] = useState<AnnouncementFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => { crud.openAdd(); setForm(defaultForm); }, [crud.openAdd]);
  const openEdit = useCallback((item: Announcement) => { crud.openEdit(item.id); setForm({ title: item.title, content: item.content, pinned: item.pinned }); }, [crud.openEdit]);
  const handleSave = useCallback(async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error(!form.title.trim() ? 'Judul informasi tidak boleh kosong' : 'Isi informasi tidak boleh kosong');
      return;
    }
    setSaving(true);
    try {
      if (crud.editingId) {
        await crud.updateItem(crud.editingId, { title: form.title, content: form.content, pinned: form.pinned });
        toast.success('Informasi berhasil diperbarui');
      } else {
        await crud.addItem({ id: `announce-${Date.now()}`, title: form.title, content: form.content, pinned: form.pinned, author: 'Admin Kecamatan', createdAt: Date.now() });
        toast.success('Informasi berhasil ditambahkan');
      }
      crud.closeForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
    } finally {
      setSaving(false);
    }
  }, [form, crud.editingId, crud.updateItem, crud.addItem, crud.closeForm]);

  const filtered = crud.filteredBySearch((item, q) =>
    item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q) || item.author.toLowerCase().includes(q)
  );

  if (crud.loading) return <AdminTableSkeleton />;

  return (
    <div className="space-y-4">
      <AdminToolbar search={crud.search} onSearchChange={crud.setSearch} placeholder="Cari informasi..." addLabel="Tambah Informasi" onAdd={openAdd} />
      {filtered.length === 0 ? (
        <AdminEmptyState icon={Bell} title="Belum ada data informasi" description="Tambahkan informasi baru untuk memulai" />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="hidden md:table-cell">Penulis</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="font-medium text-sm leading-snug">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.content}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Clock className="w-3 h-3" />{formatDate(item.createdAt)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.pinned ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 gap-1 text-[10px]"><Pin className="w-2.5 h-2.5" />Disematkan</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Biasa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{item.author}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => crud.requestDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={crud.formOpen} onOpenChange={crud.closeForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{crud.editingId ? 'Edit Informasi' : 'Tambah Informasi Baru'}</DialogTitle>
            <DialogDescription>{crud.editingId ? 'Perbarui informasi informasi.' : 'Isi formulir berikut untuk menambahkan informasi baru.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="announce-title">Judul Informasi</Label>
              <Input id="announce-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Contoh: Pendaftaran Peserta Didik Baru" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announce-content">Isi Informasi</Label>
              <Textarea id="announce-content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Tulis isi informasi..." rows={5} className="resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="announce-pinned" checked={form.pinned} onCheckedChange={(checked) => setForm((f) => ({ ...f, pinned: checked === true }))} />
              <Label htmlFor="announce-pinned" className="cursor-pointer"><span className="flex items-center gap-1.5"><Pin className="w-3.5 h-3.5 text-amber-600" />Sematkan informasi (Prioritas tampil)</span></Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={crud.closeForm}>Batal</Button>
            <Button onClick={handleSave} className="bg-blue-800 hover:bg-blue-900 text-white">{crud.editingId ? 'Simpan Perubahan' : 'Tambah Informasi'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog open={crud.deleteOpen} onOpenChange={crud.cancelDelete} title="Hapus Informasi" description="Apakah Anda yakin ingin menghapus informasi ini? Tindakan ini tidak dapat dibatalkan." onConfirm={async () => {
        await crud.confirmDelete();
        toast.success('Informasi berhasil dihapus');
      }} />
    </div>
  );
}
