'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import SuperPageShell from '@/components/admin/SuperPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperSettingsPage() {
  const [form, setForm] = useState({ portalName: '', description: '', keywords: '', footer: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'profile')).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          portalName: d.portalName || '',
          description: d.description || '',
          keywords: d.keywords || '',
          footer: d.footer || '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!db) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'profile'), { ...form, updatedAt: Date.now() }, { merge: true });
      toast.success('Pengaturan berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    }
    setSaving(false);
  }

  return (
    <SuperPageShell title="Pengaturan Portal" subtitle="Konfigurasi portal pendidikan">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm p-6 space-y-4">
            <div>
              <Label>Nama Portal</Label>
              <Input value={form.portalName} onChange={(e) => setForm(p => ({ ...p, portalName: e.target.value }))} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label>Keywords (SEO)</Label>
              <Input value={form.keywords} onChange={(e) => setForm(p => ({ ...p, keywords: e.target.value }))} />
            </div>
            <div>
              <Label>Footer</Label>
              <Textarea value={form.footer} onChange={(e) => setForm(p => ({ ...p, footer: e.target.value }))} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </Button>
          </div>
        </div>
      )}
    </SuperPageShell>
  );
}
