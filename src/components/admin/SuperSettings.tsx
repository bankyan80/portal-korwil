'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { getDocById } from '@/lib/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function SuperSettings() {
  const { setCurrentView } = useAppStore();
  const [form, setForm] = useState({ tentang: '', visi: '', misi: '', alamat: '', email: '', telepon: '', kepalaDinas: '', jabatan: '', sambutan: '', fotoKepalaDinas: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    getDocById('settings', 'profile').then(d => {
      if (d) {
        setForm({
          tentang: d.tentang || '',
          visi: d.visi || '',
          misi: Array.isArray(d.misi) ? d.misi.join('\n') : '',
          alamat: d.alamat || '',
          email: d.email || '',
          telepon: d.telepon || '',
          kepalaDinas: d.kepalaDinas || '',
          jabatan: d.jabatan || '',
          sambutan: d.sambutan || '',
          fotoKepalaDinas: d.fotoKepalaDinas || '',
        });
      }
    }).catch((e) => { console.error('Error loading settings:', e); }).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!db) return;
    setSaving(true);
    try {
      await setDoc(doc(db!, 'settings', 'profile'), {
        ...form,
        misi: form.misi.split('\n').filter(Boolean),
        updatedAt: Date.now(),
      });
      toast.success('Pengaturan disimpan');
    } catch (e) { console.error('Error saving settings:', e); toast.error('Gagal menyimpan'); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('super-dashboard')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pengaturan Portal</h1>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-4">
          <div className="space-y-2">
            <Label>Tentang Portal</Label>
            <Textarea value={form.tentang} onChange={e => setForm(f => ({...f, tentang: e.target.value}))} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Visi</Label>
            <Textarea value={form.visi} onChange={e => setForm(f => ({...f, visi: e.target.value}))} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Misi <span className="text-xs text-muted-foreground">(satu baris per misi)</span></Label>
            <Textarea value={form.misi} onChange={e => setForm(f => ({...f, misi: e.target.value}))} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input value={form.alamat} onChange={e => setForm(f => ({...f, alamat: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Telepon</Label>
            <Input value={form.telepon} onChange={e => setForm(f => ({...f, telepon: e.target.value}))} />
          </div>
          <div className="border-t pt-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Profil Kepala Dinas</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kepala Dinas</Label>
                  <Input value={form.kepalaDinas} onChange={e => setForm(f => ({...f, kepalaDinas: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan</Label>
                  <Input value={form.jabatan} onChange={e => setForm(f => ({...f, jabatan: e.target.value}))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sambutan</Label>
                <Textarea value={form.sambutan} onChange={e => setForm(f => ({...f, sambutan: e.target.value}))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>URL Foto Kepala Dinas</Label>
                <Input value={form.fotoKepalaDinas} onChange={e => setForm(f => ({...f, fotoKepalaDinas: e.target.value}))} />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Pengaturan
          </Button>
        </div>
      )}
    </div>
  );
}
