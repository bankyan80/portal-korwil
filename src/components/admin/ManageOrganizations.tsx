'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Building2, Phone, Users, Pencil, Trash2, Plus, X, Target, BadgeCheck, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Organization } from '@/types';
import { useOrganizationsCrud } from '@/hooks/use-firestore-crud';
import { AdminToolbar, AdminEmptyState, AdminDeleteDialog } from '@/components/shared/AdminTable';

interface OrgFormData {
  name: string;
  leader: string;
  contact: string;
  logo: string;
  active: boolean;
  description: string;
  vision: string;
  mission: string[];
  board: { jabatan: string; nama: string }[];
}

const defaultForm: OrgFormData = {
  name: '', leader: '', contact: '', logo: '', active: true,
  description: '', vision: '', mission: [], board: [],
};

const colorPalette = ['bg-blue-600', 'bg-green-600', 'bg-red-600', 'bg-orange-600', 'bg-purple-600', 'bg-teal-600', 'bg-indigo-600', 'bg-slate-600'];

function getInitials(name: string) {
  const match = name.match(/\(([^)]+)\)/);
  if (match) return match[1].replace(/\s/g, '').slice(0, 3);
  return name.split(' ').filter((w) => !['dan', 'di', 'ke', 'yang', 'untuk', 'dengan'].includes(w.toLowerCase())).map((w) => w[0]).filter(Boolean).slice(0, 3).join('').toUpperCase();
}

export function ManageOrganizations() {
  const crud = useOrganizationsCrud();
  const { user } = useAppStore();
  const [form, setForm] = useState<OrgFormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [newMission, setNewMission] = useState('');
  const [newBoardJabatan, setNewBoardJabatan] = useState('');
  const [newBoardNama, setNewBoardNama] = useState('');

  const userOrg = user?.organization || '';
  const isOrganisasi = user?.role === 'organisasi';

  const openAdd = useCallback(() => { crud.openAdd(); setForm(defaultForm); }, [crud.openAdd]);
  const openEdit = useCallback((item: Organization) => {
    crud.openEdit(item.id);
    setForm({
      name: item.name, leader: item.leader, contact: item.contact, logo: item.logo, active: item.active,
      description: item.description || '', vision: item.vision || '', mission: item.mission || [], board: item.board || [],
    });
  }, [crud.openEdit]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { toast.error('Nama organisasi tidak boleh kosong'); return; }
    if (!form.leader.trim()) { toast.error('Nama ketua/pimpinan tidak boleh kosong'); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        leader: form.leader,
        contact: form.contact,
        logo: form.logo || `https://placehold.co/80x80/475569/white?text=${getInitials(form.name)}`,
        active: form.active,
        description: form.description,
        vision: form.vision,
        mission: form.mission,
        board: form.board,
      };
      if (crud.editingId) {
        await crud.updateItem(crud.editingId, data);
        toast.success('Organisasi berhasil diperbarui');
      } else {
        await crud.addItem({ id: `org-${Date.now()}`, ...data });
        toast.success('Organisasi berhasil ditambahkan');
      }
      crud.closeForm();
    } catch (error) {
      console.error('Error saving organization:', error);
    } finally {
      setSaving(false);
    }
  }, [form, crud.editingId, crud.updateItem, crud.addItem, crud.closeForm]);

  const filtered = useMemo(() => {
    let items = crud.items;
    if (isOrganisasi && userOrg) {
      items = items.filter((item) => item.name.toLowerCase().includes(userOrg.toLowerCase()));
    }
    if (!crud.search.trim()) return items;
    const q = crud.search.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q) || item.leader.toLowerCase().includes(q));
  }, [crud.items, crud.search, isOrganisasi, userOrg]);

  if (crud.loading) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><div className="h-10 w-48 bg-muted rounded animate-pulse" /><div className="h-10 w-64 bg-muted rounded animate-pulse" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 bg-muted rounded-xl animate-pulse" />)}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari organisasi..." value={crud.search} onChange={(e) => crud.setSearch(e.target.value)} className="pl-9" />
        </div>
        {!isOrganisasi && (
          <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
            <Plus className="w-4 h-4" />Tambah Organisasi
          </Button>
        )}
      </div>
      {isOrganisasi && (
        <p className="text-xs text-muted-foreground -mt-2">Menampilkan organisasi: <strong>{userOrg}</strong></p>
      )}
      {filtered.length === 0 ? (
        <AdminEmptyState icon={Building2} title="Belum ada data organisasi" description="Tambahkan organisasi baru untuk memulai" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((org, idx) => (
            <Card key={org.id} className={`border shadow-sm hover:shadow-md transition-all ${!org.active ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {org.logo && !org.logo.includes('placehold.co') ? (
                    <img src={org.logo} alt={org.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className={`flex items-center justify-center w-14 h-14 rounded-xl ${colorPalette[idx % colorPalette.length]} text-white font-bold text-sm shrink-0`}>
                      {getInitials(org.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2">{org.name}</h3>
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{org.leader}</span></div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{org.contact}</span></div>
                    </div>
                    {org.board && org.board.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">{org.board.length} pengurus terdaftar</p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      {isOrganisasi ? (
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${org.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {org.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Switch checked={org.active} onCheckedChange={async (checked) => {
                            await crud.updateItem(org.id, { active: checked });
                            toast.success(checked ? 'Organisasi diaktifkan' : 'Organisasi dinonaktifkan');
                          }} />
                          <span className="text-xs text-muted-foreground">{org.active ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEdit(org)}><Pencil className="w-3.5 h-3.5" /></Button>
                        {!isOrganisasi && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => crud.requestDelete(org.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={crud.formOpen} onOpenChange={crud.closeForm}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{crud.editingId ? 'Edit Organisasi' : 'Tambah Organisasi Baru'}</DialogTitle>
            <DialogDescription>{crud.editingId ? 'Perbarui informasi organisasi.' : 'Isi formulir berikut untuk menambahkan organisasi baru.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[#0d3b66] flex items-center gap-2"><Building2 className="w-4 h-4" />Informasi Dasar</h4>
              <div className="space-y-2">
                <Label htmlFor="org-name">Nama Organisasi</Label>
                <Input id="org-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: K3S Kecamatan Lemahabang" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-leader">Ketua / Pimpinan</Label>
                  <Input id="org-leader" value={form.leader} onChange={(e) => setForm((f) => ({ ...f, leader: e.target.value }))} placeholder="Contoh: H. Ahmad Fauzi, S.Pd." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-contact">Kontak (Telepon)</Label>
                  <Input id="org-contact" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="Contoh: 0812-3456-7890" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-logo">URL Logo</Label>
                <Input id="org-logo" value={form.logo} onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))} placeholder="https://contoh.com/logo.png (opsional)" />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="org-active" checked={form.active} onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))} />
                <Label htmlFor="org-active" className="cursor-pointer">Organisasi aktif</Label>
              </div>
            </div>

            {/* Description & Vision */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-[#0d3b66] flex items-center gap-2"><FileText className="w-4 h-4" />Tentang & Visi</h4>
              <div className="space-y-2">
                <Label htmlFor="org-desc">Deskripsi</Label>
                <Textarea id="org-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Deskripsi organisasi..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-vision">Visi</Label>
                <Textarea id="org-vision" value={form.vision} onChange={(e) => setForm((f) => ({ ...f, vision: e.target.value }))} rows={2} placeholder="Visi organisasi..." />
              </div>
            </div>

            {/* Mission */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#0d3b66] flex items-center gap-2"><Target className="w-4 h-4" />Misi</h4>
              <div className="space-y-2">
                {form.mission.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="text-sm flex-1">{m}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 shrink-0" onClick={() => setForm((f) => ({ ...f, mission: f.mission.filter((_, j) => j !== i) }))}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input value={newMission} onChange={(e) => setNewMission(e.target.value)} placeholder="Tambah misi..." className="text-sm" onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMission.trim()) {
                    setForm((f) => ({ ...f, mission: [...f.mission, newMission.trim()] }));
                    setNewMission('');
                  }
                }} />
                <Button variant="outline" size="sm" onClick={() => {
                  if (newMission.trim()) {
                    setForm((f) => ({ ...f, mission: [...f.mission, newMission.trim()] }));
                    setNewMission('');
                  }
                }}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            {/* Board */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-[#0d3b66] flex items-center gap-2"><BadgeCheck className="w-4 h-4" />Kepengurusan</h4>
              <div className="space-y-2">
                {form.board.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-gray-500 w-24 shrink-0">{b.jabatan}</span>
                    <span className="text-sm flex-1">{b.nama}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 shrink-0" onClick={() => setForm((f) => ({ ...f, board: f.board.filter((_, j) => j !== i) }))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input value={newBoardJabatan} onChange={(e) => setNewBoardJabatan(e.target.value)} placeholder="Jabatan..." className="text-sm w-40" />
                <Input value={newBoardNama} onChange={(e) => setNewBoardNama(e.target.value)} placeholder="Nama..." className="text-sm flex-1" onKeyDown={(e) => {
                  if (e.key === 'Enter' && newBoardJabatan.trim() && newBoardNama.trim()) {
                    setForm((f) => ({ ...f, board: [...f.board, { jabatan: newBoardJabatan.trim(), nama: newBoardNama.trim() }] }));
                    setNewBoardJabatan('');
                    setNewBoardNama('');
                  }
                }} />
                <Button variant="outline" size="sm" onClick={() => {
                  if (newBoardJabatan.trim() && newBoardNama.trim()) {
                    setForm((f) => ({ ...f, board: [...f.board, { jabatan: newBoardJabatan.trim(), nama: newBoardNama.trim() }] }));
                    setNewBoardJabatan('');
                    setNewBoardNama('');
                  }
                }}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={crud.closeForm}>Batal</Button>
            <Button onClick={handleSave} className="bg-blue-800 hover:bg-blue-900 text-white" disabled={saving}>{saving ? 'Menyimpan...' : crud.editingId ? 'Simpan Perubahan' : 'Tambah Organisasi'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog open={crud.deleteOpen} onOpenChange={crud.cancelDelete} title="Hapus Organisasi" description="Apakah Anda yakin ingin menghapus organisasi ini? Tindakan ini tidak dapat dibatalkan." onConfirm={async () => {
        await crud.confirmDelete();
        toast.success('Organisasi berhasil dihapus');
      }} />
    </div>
  );
}
