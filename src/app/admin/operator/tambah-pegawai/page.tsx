'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import {
  ArrowLeft, Save, Loader2, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

const defaultForm = {
  nik: '', nama: '', nuptk: '', jk: 'L', tempat_lahir: '',
  tanggal_lahir: '', nip: '', status_kepegawaian: 'PPPK',
  jenis_ptk: 'Guru', tugas_tambahan: '', tmt: '', sekolah: '',
};

type FormKey = keyof typeof defaultForm;

export default function TambahPegawaiPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const userSchool = user?.schoolName || '';

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function update(key: FormKey, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nik.trim() || !form.nama.trim()) {
      toast.error('NIK dan Nama wajib diisi');
      return;
    }

    setSaving(true);
    try {
      // 1. Simpan data ke Sheet
      const data = { ...form, sekolah: form.sekolah || userSchool };
      const res = await fetch('/api/pegawai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal menyimpan');

      // 2. Upload file jika ada
      if (file) {
        const currentUser = auth?.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          const fd = new FormData();
          fd.append('file', file);
          fd.append('nik', form.nik.trim());
          fd.append('kategori', 'dokumen');
          if (user?.schoolId) fd.append('sekolahId', user.schoolId);

          const uploadRes = await fetch('/api/upload-pegawai', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            toast.warning(`Data tersimpan, tapi file gagal diupload: ${err.error}`);
          }
        }
      }

      toast.success('Data pegawai berhasil disimpan');
      router.push('/admin/operator/data-guru');
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SimpleAdminLayout>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-[#0d3b66]">Tambah Pegawai</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Data Pegawai</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>NIK *</Label>
                  <Input value={form.nik} onChange={e => update('nik', e.target.value)} placeholder="16 digit" required />
                </div>
                <div className="space-y-1">
                  <Label>Nama Lengkap *</Label>
                  <Input value={form.nama} onChange={e => update('nama', e.target.value.toUpperCase())} required />
                </div>
                <div className="space-y-1">
                  <Label>NUPTK</Label>
                  <Input value={form.nuptk} onChange={e => update('nuptk', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Jenis Kelamin</Label>
                  <select value={form.jk} onChange={e => update('jk', e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background">
                    <option value="L">L</option>
                    <option value="P">P</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Tempat Lahir</Label>
                  <Input value={form.tempat_lahir} onChange={e => update('tempat_lahir', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Tanggal Lahir</Label>
                  <Input type="date" value={form.tanggal_lahir} onChange={e => update('tanggal_lahir', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>NIP</Label>
                  <Input value={form.nip} onChange={e => update('nip', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Status Kepegawaian</Label>
                  <select value={form.status_kepegawaian} onChange={e => update('status_kepegawaian', e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background">
                    {['PNS', 'PPPK', 'GTY/PTY', 'Honor Sekolah', 'Non ASN'].map(o =>
                      <option key={o} value={o}>{o}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Jenis PTK</Label>
                  <select value={form.jenis_ptk} onChange={e => update('jenis_ptk', e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background">
                    {['Guru', 'Tenaga Kependidikan', 'Kepala Sekolah', 'Pengawas'].map(o =>
                      <option key={o} value={o}>{o}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Tugas Tambahan</Label>
                  <Input value={form.tugas_tambahan} onChange={e => update('tugas_tambahan', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>TMT Pengangkatan</Label>
                  <Input type="date" value={form.tmt} onChange={e => update('tmt', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Sekolah</Label>
                  <Input value={form.sekolah || userSchool} onChange={e => update('sekolah', e.target.value)}
                    placeholder={userSchool || 'Nama sekolah'} />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <Label className="mb-2 block">Upload Berkas SK (opsional)</Label>
                <input
                  ref={fileRef} type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}
                  className="gap-2">
                  <Upload className="w-4 h-4" />
                  {file ? file.name : 'Pilih File'}
                </Button>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
                <Button type="submit" disabled={saving || uploading} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
                  {(saving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" /> Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </SimpleAdminLayout>
  );
}
