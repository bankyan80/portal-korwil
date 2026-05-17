'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Users, Mail, Shield, Search, RefreshCw, Building2, School, Pencil, Save, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile, UserRole } from '@/types';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { AdminEmptyState, AdminTableSkeleton } from '@/components/shared/AdminTable';

const roleConfig: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'bg-red-100 text-red-800 border-red-200' },
  operator_sekolah: { label: 'Operator Sekolah', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  ketua_organisasi: { label: 'Ketua Organisasi', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  publik: { label: 'Pengguna', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'operator_sekolah', label: 'Operator Sekolah' },
  { value: 'ketua_organisasi', label: 'Ketua Organisasi' },
  { value: 'publik', label: 'Pengguna' },
];

const formatDate = (ts: number) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ts));

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function getAffiliation(user: UserProfile) {
  return user.schoolName || user.organization || '-';
}

const PAGE_SIZE = 20;

export function ManageUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editSchool, setEditSchool] = useState('');
  const [editOrg, setEditOrg] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', role: 'operator_sekolah' as UserRole, schoolId: '', organizationId: '' });
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!db) return;
    const schoolsUnsub = onSnapshot(collection(db, 'schools'), (snap) => {
      setSchools(snap.docs.map(d => ({ id: d.id, name: d.data().name || '' })));
    }, () => {});
    const orgsUnsub = onSnapshot(collection(db, 'organizations'), (snap) => {
      setOrgs(snap.docs.map(d => ({ id: d.id, name: d.data().name || '' })));
    }, () => {});

    return () => {
      schoolsUnsub();
      orgsUnsub();
    };
  }, []);

  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map(d => d.data() as UserProfile);
        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error in users realtime listener:', err);
        toast.error('Gagal memuat data user');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleChangeRole = useCallback(async (uid: string, newRole: UserRole) => {
    if (!db) return;
    setUpdating(uid);
    try {
      await setDoc(doc(db, 'users', uid), { role: newRole, updatedAt: Date.now() }, { merge: true });
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
      toast.success('Role berhasil diubah');
    } catch {
      toast.error('Gagal mengubah role');
    } finally {
      setUpdating(null);
    }
  }, []);

  const openEditAffiliation = useCallback((user: UserProfile) => {
    setEditUser(user);
    const matchSchool = schools.find(s => s.name === user.schoolName || s.id === user.schoolId);
    setEditSchool(matchSchool?.id || user.schoolName || '');
    const matchOrg = orgs.find(o => o.name === user.organization || o.id === user.organizationId);
    setEditOrg(matchOrg?.id || user.organization || '');
  }, [schools, orgs]);

  const saveAffiliation = useCallback(async () => {
    if (!editUser || !db) return;
    setUpdating(editUser.uid);
    try {
      const matchSchool = schools.find(s => s.id === editSchool || s.name === editSchool);
      const matchOrg = orgs.find(o => o.id === editOrg || o.name === editOrg);
      const body: Record<string, unknown> = { updatedAt: Date.now() };
      if (matchSchool) { body.schoolId = matchSchool.id; body.schoolName = matchSchool.name; }
      else { body.schoolName = editSchool; }
      if (matchOrg) { body.organizationId = matchOrg.id; body.organization = matchOrg.name; }
      else { body.organization = editOrg; }
      await setDoc(doc(db, 'users', editUser.uid), body, { merge: true });
      setUsers((prev) => prev.map((u) => u.uid === editUser.uid ? { ...u, ...body } : u));
      toast.success('Berhasil diperbarui');
      setEditUser(null);
    } catch {
      toast.error('Gagal memperbarui');
    } finally {
      setUpdating(null);
    }
  }, [editUser, editSchool, editOrg, schools, orgs]);

  async function handleAddUser() {
    if (!addForm.email.trim()) { toast.error('Email harus diisi'); return; }
    if (!db || !auth?.currentUser) { toast.error('Koneksi database tidak tersedia'); return; }
    setAdding(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User berhasil didaftarkan');
        setAddOpen(false);
        setAddForm({ email: '', role: 'operator_sekolah', schoolId: '', organizationId: '' });
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal mendaftarkan user');
      }
    } catch {
      toast.error('Gagal mendaftarkan user');
    } finally {
      setAdding(false);
    }
  }

  const filtered = users.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.displayName.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      (item.schoolName || '').toLowerCase().includes(q) ||
      (item.organization || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when search changes
  useEffect(() => { setPage(1); }, [search]);

  if (loading) return <AdminTableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari user..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full bg-background text-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
            <Plus className="w-4 h-4" /> Tambah User
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} total user{search ? ` (filter: "${search}")` : ''}</span>
        {totalPages > 1 && <span>Halaman {page} dari {totalPages}</span>}
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState icon={Users} title="Belum ada data user" description="User akan muncul setelah login menggunakan Google" />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="hidden md:table-cell">Sekolah/Organisasi</TableHead>
                <TableHead className="hidden xl:table-cell">Terdaftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((user, idx) => {
                const realIdx = (page - 1) * PAGE_SIZE + idx + 1;
                const rc = roleConfig[user.role] || roleConfig.publik;
                return (
                  <TableRow key={user.uid}>
                    <TableCell className="text-center text-muted-foreground">{realIdx}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold shrink-0">
                          {getInitials(user.displayName)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Select value={user.role} disabled={updating === user.uid}
                        onValueChange={(val) => handleChangeRole(user.uid, val as UserRole)}>
                        <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 focus:ring-0 focus:ring-offset-0">
                          <Badge className={`${rc.className} text-[10px] cursor-pointer`}>{updating === user.uid ? '...' : rc.label}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2"><Shield className="w-3 h-3" />{opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <button onClick={() => openEditAffiliation(user)}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-blue-600 transition-colors group">
                        {user.role === 'operator_sekolah' && <School className="w-3.5 h-3.5 shrink-0" />}
                        {user.role === 'ketua_organisasi' && <Building2 className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate max-w-[180px]">{getAffiliation(user)}</span>
                        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Affiliation Dialog */}
      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editUser?.role === 'operator_sekolah' ? 'Sekolah' : 'Organisasi'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm font-medium text-foreground">{editUser?.displayName}</p>
            {editUser?.role === 'operator_sekolah' && (
              <div className="space-y-2">
                <Label>Sekolah</Label>
                <Select value={editSchool} onValueChange={setEditSchool}>
                  <SelectTrigger><SelectValue placeholder="Pilih sekolah" /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {editUser?.role === 'ketua_organisasi' && (
              <div className="space-y-2">
                <Label>Organisasi</Label>
                <Select value={editOrg} onValueChange={setEditOrg}>
                  <SelectTrigger><SelectValue placeholder="Pilih organisasi" /></SelectTrigger>
                  <SelectContent>
                    {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(editUser?.role === 'super_admin' || editUser?.role === 'publik') && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Sekolah (opsional)</Label>
                  <Select value={editSchool} onValueChange={setEditSchool}>
                    <SelectTrigger><SelectValue placeholder="Pilih sekolah" /></SelectTrigger>
                    <SelectContent>
                      {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Organisasi (opsional)</Label>
                  <Select value={editOrg} onValueChange={setEditOrg}>
                    <SelectTrigger><SelectValue placeholder="Pilih organisasi" /></SelectTrigger>
                    <SelectContent>
                      {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Batal</Button>
            <Button onClick={saveAffiliation} disabled={updating === editUser?.uid} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              <Save className="w-4 h-4" /> Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) setAddOpen(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah User Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com" />
              <p className="text-xs text-muted-foreground">User akan dibuat di Firebase Auth dan profil Firestore</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={addForm.role} onValueChange={v => setAddForm(f => ({ ...f, role: v as UserRole, schoolId: '', organizationId: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {addForm.role === 'operator_sekolah' && (
              <div className="space-y-2">
                <Label>Sekolah</Label>
                <Select value={addForm.schoolId} onValueChange={v => setAddForm(f => ({ ...f, schoolId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih sekolah" /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {addForm.role === 'ketua_organisasi' && (
              <div className="space-y-2">
                <Label>Organisasi</Label>
                <Select value={addForm.organizationId} onValueChange={v => setAddForm(f => ({ ...f, organizationId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih organisasi" /></SelectTrigger>
                  <SelectContent>
                    {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={handleAddUser} disabled={adding} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Daftarkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Sebelumnya
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>
              {p}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  );
}
