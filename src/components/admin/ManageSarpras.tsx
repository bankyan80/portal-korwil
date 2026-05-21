'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAutoSaveForm } from '@/hooks/useAutoSaveForm';
import { AutoSaveStatusBadge } from '@/components/AutoSaveStatus';
import { enqueue } from '@/lib/local/offlineQueue';
import type { AutoSaveStatus } from '@/hooks/useAutoSaveForm';

const defaultForm = {
  tanah_pemerintah: '', tanah_yayasan: '', tanah_perseorangan: '',
  ruang_kelas: '', ruang_kelas_baik_bgn: '', ruang_kelas_baik_rgn: '', ruang_kelas_sedang_bgn: '', ruang_kelas_sedang_rgn: '', ruang_kelas_rusak_bgn: '', ruang_kelas_rusak_rgn: '',
  perpustakaan: '', perpustakaan_baik_bgn: '', perpustakaan_baik_rgn: '', perpustakaan_sedang_bgn: '', perpustakaan_sedang_rgn: '', perpustakaan_rusak_bgn: '', perpustakaan_rusak_rgn: '',
  uks: '', uks_baik_bgn: '', uks_baik_rgn: '', uks_sedang_bgn: '', uks_sedang_rgn: '', uks_rusak_bgn: '', uks_rusak_rgn: '',
  toilet: '', toilet_baik_bgn: '', toilet_baik_rgn: '', toilet_sedang_bgn: '', toilet_sedang_rgn: '', toilet_rusak_bgn: '', toilet_rusak_rgn: '',
  mushola: '', mushola_baik_bgn: '', mushola_baik_rgn: '', mushola_sedang_bgn: '', mushola_sedang_rgn: '', mushola_rusak_bgn: '', mushola_rusak_rgn: '',
  gudang: '', gudang_baik_bgn: '', gudang_baik_rgn: '', gudang_sedang_bgn: '', gudang_sedang_rgn: '', gudang_rusak_bgn: '', gudang_rusak_rgn: '',
  ruang_guru: '', ruang_guru_baik_bgn: '', ruang_guru_baik_rgn: '', ruang_guru_sedang_bgn: '', ruang_guru_sedang_rgn: '', ruang_guru_rusak_bgn: '', ruang_guru_rusak_rgn: '',
  ruang_kepala_sekolah: '', ruang_kepala_sekolah_baik_bgn: '', ruang_kepala_sekolah_baik_rgn: '', ruang_kepala_sekolah_sedang_bgn: '', ruang_kepala_sekolah_sedang_rgn: '', ruang_kepala_sekolah_rusak_bgn: '', ruang_kepala_sekolah_rusak_rgn: '',
  rumah_dinas_kepsek: '', rumah_dinas_kepsek_baik_bgn: '', rumah_dinas_kepsek_baik_rgn: '', rumah_dinas_kepsek_sedang_bgn: '', rumah_dinas_kepsek_sedang_rgn: '', rumah_dinas_kepsek_rusak_bgn: '', rumah_dinas_kepsek_rusak_rgn: '',
  bangku: '', bangku_baik: '', bangku_rusak: '',
  meja_murid: '', meja_murid_baik: '', meja_murid_rusak: '',
  kursi_murid: '', kursi_murid_baik: '', kursi_murid_rusak: '',
  kursi_guru: '', kursi_guru_baik: '', kursi_guru_rusak: '',
  meja_guru: '', meja_guru_baik: '', meja_guru_rusak: '',
  lemari: '', lemari_baik: '', lemari_rusak: '',
  papan_tulis: '', papan_tulis_baik: '', papan_tulis_rusak: '',
  kursi_tamu: '', kursi_tamu_baik: '', kursi_tamu_rusak: '',
  rak_buku: '', rak_buku_baik: '', rak_buku_rusak: '',
  sumber_air: '',
  menyewa_per_bulan: '', menumpang_di_sd: '',
  bangunan_sekolah_p: '', bangunan_sekolah_sp: '', bangunan_sekolah_dr: '',
  r_dinas_kepsek_p: '', r_dinas_kepsek_sp: '', r_dinas_kepsek_dr: '',
  r_dinas_guru_p: '', r_dinas_guru_sp: '', r_dinas_guru_dr: '',
  perpustakaan_p: '', perpustakaan_sp: '', perpustakaan_dr: '',
};

const labelMap: Record<string, string> = {
  tanah_pemerintah: 'Tanah Pemerintah (m²)', tanah_yayasan: 'Tanah Yayasan (m²)', tanah_perseorangan: 'Tanah Perseorangan (m²)',
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

const roomList = [
  { key: 'ruang_kelas', label: 'Ruang Kelas' },
  { key: 'perpustakaan', label: 'Perpustakaan' },
  { key: 'uks', label: 'UKS' },
  { key: 'toilet', label: 'WC/Toilet' },
  { key: 'mushola', label: 'Mushola' },
  { key: 'gudang', label: 'Gudang' },
  { key: 'ruang_guru', label: 'Ruang Guru' },
  { key: 'ruang_kepala_sekolah', label: 'Ruang Kepala Sekolah' },
  { key: 'rumah_dinas_kepsek', label: 'Rumah Dinas Kepala Sekolah' },
];

const perkakasList = [
  { key: 'bangku', label: 'Bangku' },
  { key: 'meja_murid', label: 'Meja Murid' },
  { key: 'kursi_murid', label: 'Kursi Murid' },
  { key: 'kursi_guru', label: 'Kursi Guru' },
  { key: 'meja_guru', label: 'Meja Guru' },
  { key: 'lemari', label: 'Lemari' },
  { key: 'papan_tulis', label: 'Papan Tulis' },
  { key: 'kursi_tamu', label: 'Kursi Tamu' },
  { key: 'rak_buku', label: 'Rak Buku' },
];

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
  menyewa: ['menyewa_per_bulan', 'menumpang_di_sd'],
  bangunan: ['bangunan_sekolah_p', 'bangunan_sekolah_sp', 'bangunan_sekolah_dr', 'r_dinas_kepsek_p', 'r_dinas_kepsek_sp', 'r_dinas_kepsek_dr', 'r_dinas_guru_p', 'r_dinas_guru_sp', 'r_dinas_guru_dr', 'perpustakaan_p', 'perpustakaan_sp', 'perpustakaan_dr'],
  lain: ['sumber_air'],
};

export function ManageSarpras() {
  const { user } = useAppStore();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');

  const draftKey = {
    userId: user?.uid || 'anon',
    schoolId: user?.schoolId,
    page: 'sarpras',
    formType: 'sarpras',
  };
  const { debouncedSave, load: loadDraft, clear: clearDraft } = useAutoSaveForm<Record<string, unknown>>(
    draftKey,
    setAutoSaveStatus,
    1000,
  );

  const updateField = useCallback((key: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      debouncedSave(next as unknown as Record<string, unknown>);
      return next;
    });
  }, [debouncedSave]);

  useEffect(() => {
    loadDraft<Record<string, unknown>>().then(draft => {
      if (draft && Object.keys(draft).length > 0) {
        setForm(prev => {
          const next = { ...prev };
          for (const k of Object.keys(defaultForm)) {
            if (draft[k] !== undefined && String(draft[k]) !== '') next[k as keyof typeof defaultForm] = String(draft[k]);
          }
          return next;
        });
        setAutoSaveStatus('saved');
      }
    });
  }, [loadDraft]);

  useEffect(() => {
    if (!db || !user?.schoolId) return;

    const docRef = doc(db, 'sarpras', user.schoolId);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
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
        setLoading(false);
      },
      (err) => {
        console.error('Error in sarpras realtime listener:', err);
        toast.error('Gagal memuat data sarpras');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
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
      await clearDraft();
      setAutoSaveStatus('saved');
      toast.success('Data sarpras berhasil disimpan');
    } catch (e) {
      console.error('Error saving sarpras:', e);
      await enqueue('update', 'sarpras', user.schoolId, { ...form, schoolId: user.schoolId, updatedAt: Date.now() });
      toast.error('Koneksi terputus, data akan dikirim saat online kembali');
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
          <AutoSaveStatusBadge status={autoSaveStatus} />
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
        </Button>
      </div>
      <div className="text-xs space-y-1">
        <p className="text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
          Semua field SARPRAS akan otomatis terisi di cetak laporan bulanan (Daftar I). <strong>Wajib diisi</strong> — jika tidak ada, isi dengan angka <strong>0</strong> atau tanda <strong>strip (-)</strong>.
        </p>
      </div>

      {/* A. TANAH */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">{sectionLabels.tanah}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sectionKeys.tanah.map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{labelMap[key]}</Label>
              <Input value={form[key as keyof typeof defaultForm]}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder="0" />
            </div>
          ))}
        </div>
      </div>

      {/* B. RUANGAN */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">{sectionLabels.ruangan}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-left text-xs font-semibold">Jenis Ruangan</th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs font-semibold" colSpan={2}>Baik</th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs font-semibold" colSpan={2}>Sedang</th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs font-semibold" colSpan={2}>Rusak</th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center text-xs font-semibold">Jumlah</th>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs"></th>
                <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 text-xs">Bgn</th>
                <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 text-xs">Rgn</th>
                <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 text-xs">Bgn</th>
                <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 text-xs">Rgn</th>
                <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 text-xs">Bgn</th>
                <th className="border border-gray-300 dark:border-gray-600 px-1 py-1 text-xs">Rgn</th>
                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {roomList.map((room) => (
                <tr key={room.key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-xs font-medium">{room.label}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-1 py-1"><Input className="h-7 text-xs text-center" value={form[`${room.key}_baik_bgn` as keyof typeof defaultForm] || ''} onChange={(e) => updateField(`${room.key}_baik_bgn`, e.target.value)} placeholder="0" /></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-1 py-1"><Input className="h-7 text-xs text-center" value={form[`${room.key}_baik_rgn` as keyof typeof defaultForm] || ''} onChange={(e) => updateField(`${room.key}_baik_rgn`, e.target.value)} placeholder="0" /></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-1 py-1"><Input className="h-7 text-xs text-center" value={form[`${room.key}_sedang_bgn` as keyof typeof defaultForm] || ''} onChange={(e) => updateField(`${room.key}_sedang_bgn`, e.target.value)} placeholder="0" /></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-1 py-1"><Input className="h-7 text-xs text-center" value={form[`${room.key}_sedang_rgn` as keyof typeof defaultForm] || ''} onChange={(e) => updateField(`${room.key}_sedang_rgn`, e.target.value)} placeholder="0" /></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-1 py-1"><Input className="h-7 text-xs text-center" value={form[`${room.key}_rusak_bgn` as keyof typeof defaultForm] || ''} onChange={(e) => updateField(`${room.key}_rusak_bgn`, e.target.value)} placeholder="0" /></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-1 py-1"><Input className="h-7 text-xs text-center" value={form[`${room.key}_rusak_rgn` as keyof typeof defaultForm] || ''} onChange={(e) => updateField(`${room.key}_rusak_rgn`, e.target.value)} placeholder="0" /></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-1 py-1"><Input className="h-7 text-xs text-center" value={form[room.key as keyof typeof defaultForm] || ''} onChange={(e) => updateField(room.key, e.target.value)} placeholder="0" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* C. MENYEWA/MENUMPANG */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">{sectionLabels.menyewa}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sectionKeys.menyewa.map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{labelMap[key]}</Label>
              <Input value={form[key as keyof typeof defaultForm]}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder="0" />
            </div>
          ))}
        </div>
      </div>

      {/* D. JENIS/SIFAT BANGUNAN */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">{sectionLabels.bangunan}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sectionKeys.bangunan.map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{labelMap[key]}</Label>
              <Input value={form[key as keyof typeof defaultForm]}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder="0" />
            </div>
          ))}
        </div>
      </div>

      {/* F. PERKAKAS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">{sectionLabels.perkakas}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-xs font-semibold">Jenis</th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-xs font-semibold">Baik</th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-xs font-semibold">Rusak</th>
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-xs font-semibold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {perkakasList.map((item) => (
                <tr key={item.key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium">{item.label}</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1"><Input className="h-7 text-xs text-center" value={form[`${item.key}_baik` as keyof typeof defaultForm] || ''} onChange={(e) => updateField(`${item.key}_baik`, e.target.value)} placeholder="0" /></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1"><Input className="h-7 text-xs text-center" value={form[`${item.key}_rusak` as keyof typeof defaultForm] || ''} onChange={(e) => updateField(`${item.key}_rusak`, e.target.value)} placeholder="0" /></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-2 py-1"><Input className="h-7 text-xs text-center" value={form[item.key as keyof typeof defaultForm] || ''} onChange={(e) => updateField(item.key, e.target.value)} placeholder="0" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LAINNYA */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2">{sectionLabels.lain}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sectionKeys.lain.map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{labelMap[key]}</Label>
              <Input value={form[key as keyof typeof defaultForm]}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder="PAM / Sumur / Mata Air / Sungai" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
