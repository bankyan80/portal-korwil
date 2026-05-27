'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { apiGet, apiSet } from '@/lib/api-firestore';
import { ArrowLeft, School, Plus, Pencil, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { normalizeSchool } from '@/lib/normalize';

interface SekolahForm {
  name: string;
  npsn: string;
  jenjang: string;
  status: string;
  desa: string;
  alamat: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  kontak: string;
  akreditasi: string;
  website: string;
}

const defaultForm: SekolahForm = {
  name: '', npsn: '', jenjang: '', status: '', desa: '',
  alamat: '', kepalaSekolah: '', nipKepalaSekolah: '', kontak: '', akreditasi: '', website: '',
};

export function SuperSekolah({ mode }: { mode?: 'admin' | 'operator' }) {
  const { user, setCurrentView } = useAppStore();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SekolahForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [pegawaiItems, setPegawaiItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/pegawai/all?all=true')
      .then(r => r.json())
      .then(d => { if (d?.items) setPegawaiItems(d.items); })
      .catch(() => {});
  }, []);

  const { kepalaSekolahMap, kepalaSekolahByNpsn } = useMemo(() => {
    const byName = new Map<string, { nama: string; nip: string }>();
    const byNpsn = new Map<string, { nama: string; nip: string }>();
    for (const r of pegawaiItems) {
      if ((r.tugas_tambahan || '').toLowerCase() !== 'kepala sekolah') continue;

      const status = (r.status_kepegawaian || '').toUpperCase();
      if (status === 'PNS' || status === 'PPPK') {
        const tglLahir = r.tanggal_lahir || '';
        if (tglLahir) {
          const parts = tglLahir.split('-');
          if (parts.length === 3) {
            const birth = new Date(+parts[0], +parts[1] - 1, +parts[2]);
            const usia = Math.floor((Date.now() - birth.getTime()) / 31557600000);
            if (usia >= 60) continue;
          }
        }
      }

      const entry = { nama: r.nama || '', nip: r.nip || '' };
      const nameKey = normalizeSchool(r.sekolah || '');
      if (nameKey && !byName.has(nameKey)) byName.set(nameKey, entry);
      if (r.npsn && !byNpsn.has(r.npsn)) byNpsn.set(r.npsn, entry);
    }
    return { kepalaSekolahMap: byName, kepalaSekolahByNpsn: byNpsn };
  }, [pegawaiItems]);

  function findKepalaSekolah(s: any): { nama: string; nip: string } | undefined {
    const nameKey = normalizeSchool(s.name || s.nama || '');
    const byName = kepalaSekolahMap.get(nameKey);
    if (byName) return byName;
    if (s.npsn) return kepalaSekolahByNpsn.get(s.npsn);
    return undefined;
  }

  const isOperator = mode === 'operator';

  useEffect(() => {
    apiGet('schools').then((res) => {
      let all = (res?.items || []).map((d: any) => ({ ...d }));
      if (isOperator && user) {
        const matchId = user.schoolId;
        const matchName = user.schoolName?.toLowerCase().trim();
        all = all.filter((s: any) =>
          s.npsn === matchId ||
          (s.name || '').toLowerCase().trim() === matchName ||
          (s.nama || '').toLowerCase().trim() === matchName
        );
      }
      setSchools(all);
      setLoading(false);

      if (isOperator && all.length === 1 && !formOpen) {
        const s = all[0];
        setEditingId(s.id);
        setForm({
          name: s.name || '', npsn: s.npsn || '', jenjang: s.jenjang || '',
          status: s.status || '', desa: s.desa || '', alamat: s.alamat || '',
          kepalaSekolah: s.kepalaSekolah || '', nipKepalaSekolah: s.nipKepalaSekolah || '', kontak: s.kontak || '',
          akreditasi: s.akreditasi || '', website: s.website || '',
        });
      }
    }).catch((err) => {
      console.error('Error fetching schools:', err);
      toast.error('Gagal memuat data sekolah');
      setLoading(false);
    });
  }, [isOperator, user?.schoolId, user?.schoolName]);

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
      kepalaSekolah: s.kepalaSekolah || '', nipKepalaSekolah: s.nipKepalaSekolah || '', kontak: s.kontak || '',
      akreditasi: s.akreditasi || '', website: s.website || '',
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const id = editingId || `school-${Date.now()}`;
      await apiSet('schools', id, { ...form, updatedAt: Date.now() });
      toast.success(editingId ? 'Profil sekolah berhasil diperbarui' : 'Sekolah berhasil ditambahkan');
      setFormOpen(false);
    } catch {
      toast.error('Gagal menyimpan');
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isOperator) {
    const mySchool = schools[0];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <School className="w-5 h-5 text-blue-700" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Profil Sekolah</h1>
        </div>

        {!mySchool ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-8 text-center">
            <School className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-muted-foreground mb-4">Data sekolah belum ditemukan di database.</p>
            <Button onClick={openAdd} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              <Plus className="w-4 h-4" /> Tambah Data Sekolah
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{mySchool.name || mySchool.nama}</h2>
                {mySchool.npsn && <p className="text-sm text-muted-foreground mt-1">NPSN: {mySchool.npsn}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={() => openEdit(mySchool)} className="gap-2">
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            </div>

            <div className="border-t dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                ['Jenjang', mySchool.jenjang],
                ['Status', mySchool.status],
                ['Desa', mySchool.desa],
                ['Alamat', mySchool.alamat],
                ['Kepala Sekolah', findKepalaSekolah(mySchool)?.nama || mySchool.kepalaSekolah],
                ['NIP Kepala Sekolah', findKepalaSekolah(mySchool)?.nip || mySchool.nipKepalaSekolah],
                ['Akreditasi', mySchool.akreditasi],
                ['Kontak', mySchool.kontak],
                ['Website', mySchool.website],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span className="text-muted-foreground block mb-0.5">{label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{value || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {formOpen && (
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Profil Sekolah' : 'Tambah Data Sekolah'}</DialogTitle>
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
                    <Label>NIP Kepala Sekolah</Label>
                    <Input value={form.nipKepalaSekolah} onChange={(e: any) => setForm(f => ({ ...f, nipKepalaSekolah: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Akreditasi</Label>
                    <Input value={form.akreditasi} onChange={(e: any) => setForm(f => ({ ...f, akreditasi: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kontak</Label>
                    <Input value={form.kontak} onChange={(e: any) => setForm(f => ({ ...f, kontak: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e: any) => setForm(f => ({ ...f, website: e.target.value }))} />
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
        )}
      </div>
    );
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

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama Sekolah</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jenjang</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NPSN</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kepala Sekolah</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIP</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Desa</th>
              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
            </tr></thead>
            <tbody className="divide-y">
              {schools.map(s => (
                <tr key={s.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name || s.nama}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.jenjang}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.npsn || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{findKepalaSekolah(s)?.nama || s.kepalaSekolah || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{findKepalaSekolah(s)?.nip || s.nipKepalaSekolah || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.desa || s.alamat || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openEdit(s)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {schools.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Belum ada data sekolah</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

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
                <Label>NIP Kepala Sekolah</Label>
                <Input value={form.nipKepalaSekolah} onChange={(e: any) => setForm(f => ({ ...f, nipKepalaSekolah: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Akreditasi</Label>
                <Input value={form.akreditasi} onChange={(e: any) => setForm(f => ({ ...f, akreditasi: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Kontak</Label>
                <Input value={form.kontak} onChange={(e: any) => setForm(f => ({ ...f, kontak: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e: any) => setForm(f => ({ ...f, website: e.target.value }))} />
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
