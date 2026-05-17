'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { normalizeSchool } from '@/lib/normalize';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import {
  ArrowLeft, Save, Loader2, Users, School,
} from 'lucide-react';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

const defaultForm = {
  nik: '',
  nisn: '',
  nama: '',
  jk: 'L',
  jenjang: 'SD',
  kelas: 1,
  tanggal_lahir: '',
  desa: '',
};

export default function TambahSiswaPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const userSchool = user?.schoolName || '';

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nik.trim()) { toast.error('NIK harus diisi'); return; }
    if (!form.nama.trim()) { toast.error('Nama harus diisi'); return; }

    setSaving(true);
    try {
      const payload = {
        nik: form.nik.trim(),
        nama: form.nama.trim(),
        jk: form.jk,
        nisn: form.nisn.trim(),
        jenjang: form.jenjang,
        kelas: form.jenjang === 'SD' ? form.kelas : undefined,
        tanggal_lahir: form.tanggal_lahir,
        sekolah: userSchool,
        schoolId: user?.schoolId || '',
        desa: form.desa.trim(),
        status: 'aktif',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      if (db) {
        await addDoc(collection(db, 'students'), payload);
      }

      toast.success('Data siswa berhasil ditambahkan');
      setForm(defaultForm);
      setTimeout(() => router.push('/admin/operator/data-siswa'), 600);
    } catch (e) {
      console.error('Error adding siswa:', e);
      toast.error('Gagal menyimpan data siswa');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/operator/data-siswa">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tambah Siswa</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <School className="inline w-3 h-3 mr-1" />
            {userSchool || 'Sekolah'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Biodata Siswa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* NIK & NISN */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">NIK <span className="text-red-500">*</span></label>
                <Input
                  value={form.nik}
                  onChange={(e) => update('nik', e.target.value)}
                  placeholder="16 digit NIK"
                  maxLength={16}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">NISN</label>
                <Input
                  value={form.nisn}
                  onChange={(e) => update('nisn', e.target.value)}
                  placeholder="Nomor NISN"
                />
              </div>
            </div>

            {/* Nama */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nama Lengkap <span className="text-red-500">*</span></label>
              <Input
                value={form.nama}
                onChange={(e) => update('nama', e.target.value)}
                placeholder="Nama sesuai akta kelahiran"
                required
              />
            </div>

            {/* Jenis Kelamin, Jenjang, Kelas */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jenis Kelamin</label>
                <select
                  value={form.jk}
                  onChange={(e) => update('jk', e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground h-10"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jenjang</label>
                <select
                  value={form.jenjang}
                  onChange={(e) => {
                    update('jenjang', e.target.value);
                    if (e.target.value !== 'SD') update('kelas', 0);
                  }}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground h-10"
                >
                  <option value="SD">SD</option>
                  <option value="TK">TK</option>
                  <option value="KB">KB</option>
                </select>
              </div>
              {form.jenjang === 'SD' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Kelas</label>
                  <select
                    value={form.kelas}
                    onChange={(e) => update('kelas', Number(e.target.value))}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-background text-foreground h-10"
                  >
                    {[1, 2, 3, 4, 5, 6].map((k) => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tanggal Lahir</label>
                <Input
                  type="date"
                  value={form.tanggal_lahir}
                  onChange={(e) => update('tanggal_lahir', e.target.value)}
                />
              </div>
            </div>

            {/* Desa */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Desa</label>
              <Input
                value={form.desa}
                onChange={(e) => update('desa', e.target.value)}
                placeholder="Nama desa / kelurahan"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Sekolah: <strong>{userSchool || '-'}</strong>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
