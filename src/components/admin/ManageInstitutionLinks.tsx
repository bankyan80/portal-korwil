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
import { Switch } from '@/components/ui/switch';
import { ExternalLink, Globe, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { InstitutionLink } from '@/types';
import { useInstitutionLinksCrud } from '@/hooks/use-firestore-crud';
import { AdminToolbar, AdminEmptyState, AdminDeleteDialog, AdminTableSkeleton } from '@/components/shared/AdminTable';

interface LinkFormData { name: string; logo: string; url: string; order: number; active: boolean; }
const defaultForm: LinkFormData = { name: '', logo: '', url: '', order: 1, active: true };

const colorPalette = ['bg-blue-600', 'bg-green-600', 'bg-red-600', 'bg-orange-600', 'bg-purple-600', 'bg-teal-600', 'bg-slate-600'];

function getInitials(name: string) {
  return name.split(' ').filter((w) => w.length > 2).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function ManageInstitutionLinks() {
  const crud = useInstitutionLinksCrud();
  const [form, setForm] = useState<LinkFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const openAdd = useCallback(() => { crud.openAdd(); setForm({ ...defaultForm, order: crud.items.length + 1 }); }, [crud.items.length, crud.openAdd]);
  const openEdit = useCallback((item: InstitutionLink) => { crud.openEdit(item.id); setForm({ name: item.name, logo: item.logo, url: item.url, order: item.order, active: item.active }); }, [crud.openEdit]);
  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { toast.error('Nama instansi tidak boleh kosong'); return; }
    if (!form.url.trim()) { toast.error('URL tidak boleh kosong'); return; }
    setSaving(true);
    try {
      if (crud.editingId) {
        await crud.updateItem(crud.editingId, { name: form.name, logo: form.logo, url: form.url, order: form.order, active: form.active });
        toast.success('Link instansi berhasil diperbarui');
      } else {
        await crud.addItem({ id: `link-${Date.now()}`, name: form.name, logo: form.logo || `https://placehold.co/48x48/475569/white?text=${getInitials(form.name)}`, url: form.url, order: form.order, active: form.active });
        toast.success('Link instansi berhasil ditambahkan');
      }
      crud.closeForm();
    } catch (error) {
      console.error('Error saving institution link:', error);
    } finally {
      setSaving(false);
    }
  }, [form, crud.editingId, crud.updateItem, crud.addItem, crud.closeForm]);

  const filtered = crud.filteredBySearch((item, q) =>
    item.name.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
  ).sort((a, b) => a.order - b.order);

  if (crud.loading) return <AdminTableSkeleton />;

  return (
    <div className="space-y-4">
      <AdminToolbar search={crud.search} onSearchChange={crud.setSearch} placeholder="Cari link instansi..." addLabel="Tambah Link" onAdd={openAdd} />
      {filtered.length === 0 ? (
        <AdminEmptyState icon={ExternalLink} title="Belum ada data link instansi" description="Tambahkan link instansi baru untuk memulai" />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="w-14 text-center">Logo</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">URL</TableHead>
                <TableHead className="text-center">Urutan</TableHead>
                <TableHead className="text-center">Aktif</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((link, idx) => (
                <TableRow key={link.id}>
                  <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="text-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorPalette[idx % colorPalette.length]} text-white text-[10px] font-bold mx-auto`}>
                      {getInitials(link.name)}
                    </div>
                  </TableCell>
                  <TableCell><p className="font-medium text-sm">{link.name}</p></TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 max-w-[250px]">
                      <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{link.url}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{link.order}</TableCell>
                  <TableCell className="text-center">
                     <Switch checked={link.active} onCheckedChange={async (checked) => {
                       await crud.updateItem(link.id, { active: checked });
                       toast.success(checked ? 'Link diaktifkan' : 'Link dinonaktifkan');
                     }} />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEdit(link)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => crud.requestDelete(link.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={crud.formOpen} onOpenChange={crud.closeForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{crud.editingId ? 'Edit Link Instansi' : 'Tambah Link Instansi Baru'}</DialogTitle>
            <DialogDescription>{crud.editingId ? 'Perbarui informasi link instansi.' : 'Isi formulir berikut untuk menambahkan link instansi baru.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="link-name">Nama Instansi</Label>
              <Input id="link-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: Kemendikbud" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-logo">URL Logo</Label>
              <Input id="link-logo" value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} placeholder="https://contoh.com/logo.png (opsional)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL Website</Label>
              <Input id="link-url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://www.contoh.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-order">Urutan</Label>
              <Input id="link-order" type="number" min={1} value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="link-active" checked={form.active} onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
              <Label htmlFor="link-active" className="cursor-pointer">Link aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={crud.closeForm}>Batal</Button>
            <Button onClick={handleSave} className="bg-blue-800 hover:bg-blue-900 text-white">{crud.editingId ? 'Simpan Perubahan' : 'Tambah Link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog open={crud.deleteOpen} onOpenChange={crud.cancelDelete} title="Hapus Link Instansi" description="Apakah Anda yakin ingin menghapus link instansi ini? Tindakan ini tidak dapat dibatalkan." onConfirm={async () => {
        await crud.confirmDelete();
        toast.success('Link instansi berhasil dihapus');
      }} />
    </div>
  );
}
