'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const defaultForm = {
  tanah_pemerintah: '', tanah_yayasan: '', tanah_perseorangan: '',
  ruang_kelas: '', perpustakaan: '', uks: '', toilet: '', mushola: '', gudang: '',
  ruang_guru: '', ruang_kepala_sekolah: '', rumah_dinas_kepsek: '',
  bangku: '', meja_murid: '', kursi_murid: '', kursi_guru: '', meja_guru: '',
  lemari: '', papan_tulis: '', kursi_tamu: '', rak_buku: '',
  sumber_air: '',
  menyewa_per_bulan: '', menumpang_di_sd: '',
  bangunan_sekolah_p: '', bangunan_sekolah_sp: '', bangunan_sekolah_dr: '',
  r_dinas_kepsek_p: '', r_dinas_kepsek_sp: '', r_dinas_kepsek_dr: '',
  r_dinas_guru_p: '', r_dinas_guru_sp: '', r_dinas_guru_dr: '',
  perpustakaan_p: '', perpustakaan_sp: '', perpustakaan_dr: '',
};

const labelMap: Record<string, string> = {
  tanah_pemerintah: 'Tanah Pemerintah (m²)', tanah_yayasan: 'Tanah Yayasan (m²)', tanah_perseorangan: 'Tanah Perseorangan (m²)',
  ruang_kelas: 'Ruang Kelas', perpustakaan: 'Perpustakaan', uks: 'UKS',
  toilet: 'WC/Toilet', mushola: 'Mushola', gudang: 'Gudang',
  ruang_guru: 'Ruang Guru', ruang_kepala_sekolah: 'Ruang Kepala Sekolah',
  rumah_dinas_kepsek: 'Rumah Dinas Kepala Sekolah',
  bangku: 'Bangku', meja_murid: 'Meja Murid', kursi_murid: 'Kursi Murid',
  kursi_guru: 'Kursi Guru', meja_guru: 'Meja Guru', lemari: 'Lemari',
  papan_tulis: 'Papan Tulis', kursi_tamu: 'Kursi Tamu', rak_buku: 'Rak Buku',
  sumber_air: 'Sumber Air',
  menyewa_per_bulan: 'Menyewa per Bulan (Rp)', menumpang_di_sd: 'Menumpang di SD',
  bangunan_sekolah_p: 'Bangunan Sekolah - Permanen',
  bangunan_sekolah_sp: 'Bangunan Sekolah - Semi Permanen',
  bangunan_sekolah_dr: 'Bangunan Sekolah - Darurat',
  r_dinas_kepsek_p: 'R. Dinas Kepsek - Permanen',
  r_dinas_kepsek_sp: 'R. Dinas Kepsek - Semi Permanen',
  r_dinas_kepsek_dr: 'R. Dinas Kepsek - Darurat',
  r_dinas_guru_p: 'R. Dinas Guru - Permanen',
  r_dinas_guru_sp: 'R. Dinas Guru - Semi Permanen',
  r_dinas_guru_dr: 'R. Dinas Guru - Darurat',
  perpustakaan_p: 'Perpustakaan - Permanen',
  perpustakaan_sp: 'Perpustakaan - Semi Permanen',
  perpustakaan_dr: 'Perpustakaan - Darurat',
};

const sectionLabels: Record<string, string> = {
  tanah: 'A. TANAH',
  ruangan: 'B. RUANGAN',
  menyewa: 'C. MENYEWA/MENUMPANG',
  bangunan: 'D. JENIS/SIFAT BANGUNAN',
  perkakas: 'F. PERKAKAS',
  lain: 'LAINNYA',
};

const sectionKeys: Record<string, string[]> = {
  tanah: ['tanah_pemerintah', 'tanah_yayasan', 'tanah_perseorangan'],
  ruangan: ['ruang_kelas', 'perpustakaan', 'uks', 'toilet', 'mushola', 'gudang', 'ruang_guru', 'ruang_kepala_sekolah', 'rumah_dinas_kepsek'],
  menyewa: ['menyewa_per_bulan', 'menumpang_di_sd'],
  bangunan: ['bangunan_sekolah_p', 'bangunan_sekolah_sp', 'bangunan_sekolah_dr', 'r_dinas_kepsek_p', 'r_dinas_kepsek_sp', 'r_dinas_kepsek_dr', 'r_dinas_guru_p', 'r_dinas_guru_sp', 'r_dinas_guru_dr', 'perpustakaan_p', 'perpustakaan_sp', 'perpustakaan_dr'],
  perkakas: ['bangku', 'meja_murid', 'kursi_murid', 'kursi_guru', 'meja_guru', 'lemari', 'papan_tulis', 'kursi_tamu', 'rak_buku'],
  lain: ['sumber_air'],
};

export function ManageSarpras() {
  const { user } = useAppStore();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!db || !user?.schoolId) { setLoading(false); return; }
    getDoc(doc(db, 'sarpras', user.schoolId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm(prev => {
          const next = { ...prev };
          for (const k of Object.keys(defaultForm)) {
            if (d[k] !== undefined && d[k] !== '') next[k as keyof typeof defaultForm] = String(d[k]);
          }
          return next;
        });
      }
    }).finally(() => setLoading(false));
  }, [user?.schoolId]);

  async function handleSave() {
    if (!db || !user?.schoolId) { toast.error('Data sekolah tidak tersedia'); return; }
    setSaving(true);
    try {
      await setDoc(doc(db, 'sarpras', user.schoolId), {
        ...form,
        schoolId: user.schoolId,
        updatedAt: Date.now(),
      }, { merge: true });
      toast.success('Data sarpras berhasil disimpan');
    } catch (e) {
      console.error('Error saving sarpras:', e);
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-700" />
          <h2 className="text-lg font-bold">Data Sarana & Prasarana</h2>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
        </Button>
      </div>
      <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
        Data sarpras akan otomatis terisi di cetak laporan bulanan.
      </p>

      {Object.entries(sectionKeys).map(([section, keys]) => (
        <div key={section} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">{sectionLabels[section]}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {keys.map((key) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{labelMap[key]}</Label>
                <Input value={form[key as keyof typeof defaultForm]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder="0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
