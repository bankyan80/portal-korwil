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
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

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

      if (!db) {
        toast.error('Firebase tidak tersedia');
        setSaving(false);
        return;
      }
      await addDoc(collection(db, 'students'), payload);

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
    <SimpleAdminLayout>
    <div className="p-0 sm:p-2">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Daftarkan Siswa Baru</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIK <span className="text-red-500">*</span></label>
            <Input value={form.nik} onChange={(e) => update('nik', e.target.value)} placeholder="16 digit NIK" maxLength={16} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NISN</label>
            <Input value={form.nisn} onChange={(e) => update('nisn', e.target.value)} placeholder="Nomor Induk Siswa Nasional" maxLength={10} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
            <Input value={form.nama} onChange={(e) => update('nama', e.target.value)} placeholder="Nama sesuai ijazah" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Kelamin</label>
            <select value={form.jk} onChange={(e) => update('jk', e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenjang</label>
              <select value={form.jenjang} onChange={(e) => update('jenjang', e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                <option value="SD">SD</option>
                <option value="MI">MI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kelas</label>
              <select value={form.kelas} onChange={(e) => update('kelas', Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
                {[1,2,3,4,5,6].map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Lahir</label>
            <Input type="date" value={form.tanggal_lahir} onChange={(e) => update('tanggal_lahir', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desa</label>
            <Input value={form.desa} onChange={(e) => update('desa', e.target.value)} placeholder="Desa asal siswa" />
          </div>
          <div className="pt-4">
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? 'Menyimpan...' : 'Simpan Data Siswa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
    </SimpleAdminLayout>
  );
}

