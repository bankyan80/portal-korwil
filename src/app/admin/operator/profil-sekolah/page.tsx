'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ArrowLeft, School, MapPin, Phone, Globe, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAutoSaveForm } from '@/hooks/useAutoSaveForm';
import { AutoSaveStatusBadge } from '@/components/AutoSaveStatus';
import { enqueue } from '@/lib/local/offlineQueue';
import type { AutoSaveStatus } from '@/hooks/useAutoSaveForm';

export default function OperatorProfilSekolah() {
  const { user } = useAppStore();
  const router = useRouter();
  const [school, setSchool] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');

  const draftKey = {
    userId: user?.uid || 'anon',
    schoolId: user?.schoolId,
    page: 'profil-sekolah',
    formType: 'profil-sekolah',
  };
  const { save: autoSave, load: loadDraft, clear: clearDraft } = useAutoSaveForm(
    draftKey,
    setAutoSaveStatus,
    1000,
  );

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'operator_sekolah') router.push('/login');
  }, [user, router]);

  useEffect(() => {
    if (!db || !user?.schoolId) return;
    const unsub = onSnapshot(doc(db, 'schools', user.schoolId), (snap) => {
      if (snap.exists()) setSchool(snap.data());
    }, (err) => { console.error('Error listening to school:', err); toast.error('Gagal memuat data sekolah'); });
    return () => unsub();
  }, [user?.schoolId]);

  async function openEdit() {
    const baseForm = {
      name: school?.name || school?.nama || '',
      npsn: school?.npsn || '',
      jenjang: school?.jenjang || '',
      status: school?.status || '',
      kepalaSekolah: school?.kepalaSekolah || '',
      pltKepalaSekolah: school?.pltKepalaSekolah || '',
      akreditasi: school?.akreditasi || '',
      alamat: school?.alamat || '',
      kontak: school?.kontak || '',
      website: school?.website || '',
    };
    const draft = await loadDraft(baseForm);
    setForm(draft);
    setEditOpen(true);
  }

  function updateForm(updater: (prev: any) => any) {
    setForm(updater);
    const next = updater(form);
    autoSave(next);
  }

  async function handleSave() {
    if (!db) { toast.error('Database tidak tersedia'); return; }
    if (!user?.schoolId) { toast.error('School ID tidak ditemukan. Hubungi administrator.'); return; }
    if (!form.name?.trim()) { toast.error('Nama sekolah harus diisi'); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, 'schools', user.schoolId), {
        name: form.name,
        npsn: form.npsn,
        jenjang: form.jenjang,
        status: form.status,
        kepalaSekolah: form.kepalaSekolah,
        pltKepalaSekolah: form.pltKepalaSekolah,
        akreditasi: form.akreditasi,
        alamat: form.alamat,
        kontak: form.kontak,
        website: form.website,
        updatedAt: Date.now(),
      }, { merge: true });
      await clearDraft();
      toast.success('Profil sekolah berhasil diperbarui');
      setEditOpen(false);
    } catch (e: any) {
      console.error('Error saving profil sekolah:', e);
      if (e.code === 'unavailable' || e.message?.includes('offline') || e.message?.includes('network')) {
        try {
          await enqueue('update', 'schools', user.schoolId, { ...form, updatedAt: Date.now() });
          toast.info('Data disimpan secara offline');
          setEditOpen(false);
        } catch {}
      } else {
        toast.error('Gagal menyimpan profil');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Profil Sekolah</h1>
          </div>
          <Button onClick={openEdit} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
            <Save className="w-4 h-4" /> Edit Profil
          </Button>
        </div>

        {school ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <School className="w-8 h-8 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{school.name || school.nama}</h2>
                <p className="text-sm text-muted-foreground">NPSN: {school.npsn || '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
              <div>
                <p className="text-xs text-muted-foreground">Jenjang</p>
                <p className="font-medium text-gray-900 dark:text-white">{school.jenjang || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium text-gray-900 dark:text-white">{school.status || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Akreditasi</p>
                <p className="font-medium text-gray-900 dark:text-white">{school.akreditasi || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kepala Sekolah</p>
                <p className="font-medium text-gray-900 dark:text-white">{school.kepalaSekolah || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plt. Kepala Sekolah</p>
                <p className="font-medium text-gray-900 dark:text-white">{school.pltKepalaSekolah || '-'}</p>
              </div>
            </div>
            <div className="pt-4 border-t dark:border-gray-700 space-y-2">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" /> {school.alamat || '-'}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" /> {school.kontak || '-'}
              </p>
              {school.website && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" /> {school.website}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Memuat data sekolah...</p>
        )}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Profil Sekolah <span className="ml-2 inline-flex"><AutoSaveStatusBadge status={autoSaveStatus} /></span></DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nama Sekolah</Label>
                <Input value={form.name} onChange={(e: any) => updateForm((f: any) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>NPSN</Label>
                  <Input value={form.npsn} onChange={(e: any) => updateForm((f: any) => ({ ...f, npsn: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Jenjang</Label>
                  <select value={form.jenjang} onChange={(e: any) => updateForm((f: any) => ({ ...f, jenjang: e.target.value }))}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                    <option value="">Pilih jenjang</option>
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
                  <select value={form.status} onChange={(e: any) => updateForm((f: any) => ({ ...f, status: e.target.value }))}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground">
                    <option value="">Pilih status</option>
                    <option value="NEGERI">NEGERI</option>
                    <option value="SWASTA">SWASTA</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Akreditasi</Label>
                  <Input value={form.akreditasi} onChange={(e: any) => updateForm((f: any) => ({ ...f, akreditasi: e.target.value }))} placeholder="A / B / C" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Kepala Sekolah</Label>
                <Input value={form.kepalaSekolah} onChange={(e: any) => updateForm((f: any) => ({ ...f, kepalaSekolah: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Plt. Kepala Sekolah</Label>
                <Input value={form.pltKepalaSekolah} onChange={(e: any) => updateForm((f: any) => ({ ...f, pltKepalaSekolah: e.target.value }))} placeholder="Kosongkan jika ada Kepala Sekolah definitif" />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input value={form.alamat} onChange={(e: any) => updateForm((f: any) => ({ ...f, alamat: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kontak</Label>
                  <Input value={form.kontak} onChange={(e: any) => updateForm((f: any) => ({ ...f, kontak: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e: any) => updateForm((f: any) => ({ ...f, website: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button onClick={handleSave} className="bg-blue-800 hover:bg-blue-900 text-white" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
