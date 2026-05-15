'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  ArrowLeft, Building2, Phone, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function OrganisasiProfilPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!user || !['ketua_organisasi'].includes(user.role)) { router.push('/login'); return; }
  }, [user, router]);

  useEffect(() => {
    if (!db || !user?.organizationId) return;
    const unsub = onSnapshot(doc(db, 'organizations', user.organizationId), (snap) => {
      if (snap.exists()) setOrg(snap.data());
    });
    return () => unsub();
  }, [user?.organizationId]);

  function openEdit() {
    setForm({
      name: org?.name || '',
      leader: org?.leader || '',
      description: org?.description || '',
      vision: org?.vision || '',
      mission: org?.mission?.join('\n') || '',
      contact: org?.contact || '',
    });
    setEditOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !db || !user?.organizationId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'organizations', user.organizationId), {
        name: form.name,
        leader: form.leader,
        description: form.description,
        vision: form.vision,
        mission: form.mission.split('\n').filter((m: string) => m.trim()),
        contact: form.contact,
        updatedAt: Date.now(),
      }, { merge: true });
      toast.success('Profil organisasi berhasil diperbarui');
      setEditOpen(false);
    } catch (e) {
      console.error('Error saving organisasi profil:', e);
      toast.error('Gagal menyimpan profil');
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
            <button onClick={() => router.push('/admin/organisasi')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Profil Organisasi</h1>
          </div>
          <Button onClick={openEdit} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
            <Save className="w-4 h-4" /> Edit Profil
          </Button>
        </div>

        {org ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-4">
            <div className="flex items-center gap-4">
              {org.logo ? (
                <img src={org.logo} alt="" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-purple-700 dark:text-purple-300" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{org.name}</h2>
                {org.leader && <p className="text-sm text-muted-foreground">Ketua: {org.leader}</p>}
              </div>
            </div>
            {org.description && (
              <div className="pt-4 border-t dark:border-gray-700">
                <p className="text-sm text-muted-foreground">{org.description}</p>
              </div>
            )}
            {org.vision && (
              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Visi</h3>
                <p className="text-sm text-muted-foreground">{org.vision}</p>
              </div>
            )}
            {org.mission && org.mission.length > 0 && (
              <div className="pt-4 border-t dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Misi</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {org.mission.map((m: string, i: number) => <li key={i}>{m}</li>)}
                </ul>
              </div>
            )}
            {org.contact && (
              <div className="pt-4 border-t dark:border-gray-700">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" /> {org.contact}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Memuat data organisasi...</p>
        )}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Profil Organisasi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nama Organisasi</Label>
                <Input value={form.name} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ketua</Label>
                <Input value={form.leader} onChange={(e) => setForm((f: any) => ({ ...f, leader: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Visi</Label>
                <Textarea value={form.vision} onChange={(e) => setForm((f: any) => ({ ...f, vision: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Misi <span className="text-xs text-muted-foreground">(satu baris per misi)</span></Label>
                <Textarea value={form.mission} onChange={(e) => setForm((f: any) => ({ ...f, mission: e.target.value }))} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Kontak</Label>
                <Input value={form.contact} onChange={(e) => setForm((f: any) => ({ ...f, contact: e.target.value }))} />
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
