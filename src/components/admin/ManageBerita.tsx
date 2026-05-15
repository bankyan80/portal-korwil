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
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Pencil, Trash2, Megaphone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { AdminEmptyState, AdminDeleteDialog } from '@/components/shared/AdminTable';
import type { News } from '@/types';

const statusConfig: Record<string, { label: string; className: string }> = {
  published: { label: 'Published', className: 'bg-green-100 text-green-800 border-green-200' },
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const defaultForm = { title: '', content: '', slug: '', excerpt: '', status: 'draft' as News['status'] };

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));

export function ManageBerita() {
  const { items, addItem, updateItem, deleteItem } = useFirestoreCollection<News>('news', []);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    return !search.trim() || item.title.toLowerCase().includes(q) || item.authorName.toLowerCase().includes(q);
  });

  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm(defaultForm);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: News) => {
    setEditingId(item.id || null);
    setForm({ title: item.title, content: item.content, slug: item.slug, excerpt: item.excerpt, status: item.status });
    setFormOpen(true);
  }, []);

  const requestDelete = useCallback((id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteOpen(false);
    setDeletingId(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingId) return;
    await deleteItem(deletingId);
    setDeleteOpen(false);
    setDeletingId(null);
    toast.success('Berita berhasil dihapus');
  }, [deletingId, deleteItem]);

  const handleSave = useCallback(async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error(!form.title.trim() ? 'Judul berita tidak boleh kosong' : 'Konten berita tidak boleh kosong');
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const excerpt = form.excerpt || form.content.substring(0, 200);
      if (editingId) {
        await updateItem(editingId, { title: form.title, content: form.content, slug, excerpt, status: form.status, updatedAt: Date.now() });
        toast.success('Berita berhasil diperbarui');
      } else {
        await addItem({ id: `news-${Date.now()}`, title: form.title, content: form.content, slug, excerpt, authorName: 'Admin', authorRole: 'Administrator', status: form.status, createdAt: Date.now(), updatedAt: Date.now() });
        toast.success('Berita berhasil ditambahkan');
      }
      setFormOpen(false);
      setForm(defaultForm);
    } catch (e) {
      console.error('Error saving berita:', e);
      toast.error('Gagal menyimpan berita');
    } finally {
      setSaving(false);
    }
  }, [form, editingId, addItem, updateItem]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari berita..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2"><Plus className="w-4 h-4" />Tambah Berita</Button>
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState icon={Megaphone} title="Belum ada berita" description="Tambahkan berita baru untuk memulai" />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Penulis</TableHead>
                <TableHead className="hidden lg:table-cell">Tanggal</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, idx) => {
                const sc = statusConfig[item.status] || statusConfig.draft;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <p className="font-medium text-sm leading-snug">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.excerpt || item.content.substring(0, 200)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className={`${sc.className} text-[10px] gap-1`}>
                        {item.status === 'published' && <CheckCircle className="w-3 h-3" />}
                        {item.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {item.status === 'pending' && <Clock className="w-3 h-3" />}
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{item.authorName}</TableCell>
                    <TableCell className="hidden lg:table-cell"><div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Clock className="w-3 h-3" />{formatDate(item.createdAt)}</div></TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => requestDelete(item.id!)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Berita' : 'Tambah Berita Baru'}</DialogTitle>
            <DialogDescription>{editingId ? 'Perbarui informasi berita.' : 'Isi formulir berikut untuk menambahkan berita baru.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Judul Berita</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Contoh: Kegiatan MPLS SDN 1" />
            </div>
            <div className="space-y-2">
              <Label>Konten</Label>
              <Textarea value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Tulis konten berita..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as News['status'] }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-fill" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="bg-blue-800 hover:bg-blue-900 text-white">{editingId ? 'Simpan Perubahan' : 'Tambah Berita'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog open={deleteOpen} onOpenChange={cancelDelete} title="Hapus Berita" description="Apakah Anda yakin ingin menghapus berita ini? Tindakan ini tidak dapat dibatalkan." onConfirm={confirmDelete} />
    </div>
  );
}
