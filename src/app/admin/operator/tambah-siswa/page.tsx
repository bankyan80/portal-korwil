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
    <SimpleAdminLayout>
    <div className="p-0 sm:p-2">
      <div className="flex items-center gap-3 mb-6 px-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Daftarkan Siswa Baru</h1>
      </div>
    </div>
    </SimpleAdminLayout>
  );
}

