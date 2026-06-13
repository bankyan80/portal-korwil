'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { MapPin, Loader2, Save, Download, RotateCcw } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';
import { exportToExcel } from '@/components/laporan/ExportButton';

const tahunAjaran = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

const defaultForm = {
  tahunPelajaran: tahunAjaran,
  jumlahSiswa: 0,
  jumlahRombel: 0,
  // Guru PAI
  pnsGuruPai: 0, pppkGuruPai: 0, pppkWGuruPai: 0, nonAsnSerdikGuruPai: 0, nonAsnMurniGuruPai: 0, nonAsnNonDapodikGuruPai: 0,
  // Guru Penjaskes
  pnsGuruPenjaskes: 0, pppkGuruPenjaskes: 0, pppkWGuruPenjaskes: 0, nonAsnSerdikGuruPenjaskes: 0, nonAsnMurniGuruPenjaskes: 0, nonAsnNonDapodikGuruPenjaskes: 0,
  // Guru Kelas
  pnsGuruKelas: 0, pppkGuruKelas: 0, pppkWGuruKelas: 0, nonAsnSerdikGuruKelas: 0, nonAsnMurniGuruKelas: 0, nonAsnNonDapodikGuruKelas: 0,
  // Tendik
  pnsTendik: 0, nonAsnSerdikTendik: 0, nonAsnMurniTendik: 0, nonAsnNonDapodikTendik: 0,
};

export default function OperatorMappingPegawai() {
  const { user } = useAppStore();
  const [school, setSchool] = useState<any>(null);
  const [mapping, setMapping] = useState<any>(null);
  const [form, setForm] = useState<any>({ ...defaultForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const calculateFromSimpeg = useCallback(async (schoolId: string) => {
    try {
      const res = await fetch(`/api/firestore/employees?field=schoolId&value=${schoolId}`);
      const json = await res.json();
      const pegawai = json.items || [];
      const cat = {
        guruPai: { pns: 0, pppk: 0, pppkW: 0, nas: 0, nam: 0, nan: 0 },
        guruPenjaskes: { pns: 0, pppk: 0, pppkW: 0, nas: 0, nam: 0, nan: 0 },
        guruKelas: { pns: 0, pppk: 0, pppkW: 0, nas: 0, nam: 0, nan: 0 },
        tendik: { pns: 0, pppk: 0, pppkW: 0, nas: 0, nam: 0, nan: 0 },
      };
      const jabatanCat = (j: string) => {
        const jl = (j || '').toLowerCase();
        if (jl.includes('guru pai')) return 'guruPai';
        if (jl.includes('guru penjaskes') || jl.includes('guru pjok')) return 'guruPenjaskes';
        if (jl.includes('guru') || jl.includes('pendidik')) return 'guruKelas';
        return 'tendik';
      };
      const statusKey = (s: string) => {
        const sl = (s || '').toLowerCase();
        if (sl.includes('pns')) return 'pns';
        if (sl.includes('pppk paruh')) return 'pppkW';
        if (sl.includes('pppk')) return 'pppk';
        if (sl.includes('serdik')) return 'nas';
        if (sl.includes('honor')) return 'nam';
        return 'nan';
      };
      pegawai.forEach((e: any) => {
        const c = jabatanCat(e.jabatan);
        const s = statusKey(e.statusPegawai);
        if (cat[c] && cat[c][s] !== undefined) cat[c][s]++;
        else cat.tendik.nan++;
      });
      return cat;
    } catch { return null; }
  }, []);

  useEffect(() => {
    if (!user?.schoolId) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/firestore/schools?id=${user.schoolId}`).then(r => r.json()),
      fetch(`/api/firestore/employee_mappings?field=schoolId&value=${user.schoolId}`).then(r => r.json()),
    ])
      .then(async ([sRes, mRes]) => {
        const schoolData = sRes.data || sRes;
        setSchool(schoolData);
        const item = mRes.items?.[0] || mRes.data;
        const fromMap = item ? {
          tahunPelajaran: item.tahunPelajaran || tahunAjaran,
          jumlahSiswa: item.jumlahSiswa || 0,
          jumlahRombel: item.jumlahRombel || 0,
          pnsGuruPai: item.pnsGuruPai || 0,
          pppkGuruPai: item.pppkGuruPai || 0,
          pppkWGuruPai: item.pppkWGuruPai || 0,
          nonAsnSerdikGuruPai: item.nonAsnSerdikGuruPai || 0,
          nonAsnMurniGuruPai: item.nonAsnMurniGuruPai || 0,
          nonAsnNonDapodikGuruPai: item.nonAsnNonDapodikGuruPai || 0,
          pnsGuruPenjaskes: item.pnsGuruPenjaskes || 0,
          pppkGuruPenjaskes: item.pppkGuruPenjaskes || 0,
          pppkWGuruPenjaskes: item.pppkWGuruPenjaskes || 0,
          nonAsnSerdikGuruPenjaskes: item.nonAsnSerdikGuruPenjaskes || 0,
          nonAsnMurniGuruPenjaskes: item.nonAsnMurniGuruPenjaskes || 0,
          nonAsnNonDapodikGuruPenjaskes: item.nonAsnNonDapodikGuruPenjaskes || 0,
          pnsGuruKelas: item.pnsGuruKelas || 0,
          pppkGuruKelas: item.pppkGuruKelas || 0,
          pppkWGuruKelas: item.pppkWGuruKelas || 0,
          nonAsnSerdikGuruKelas: item.nonAsnSerdikGuruKelas || 0,
          nonAsnMurniGuruKelas: item.nonAsnMurniGuruKelas || 0,
          nonAsnNonDapodikGuruKelas: item.nonAsnNonDapodikGuruKelas || 0,
          pnsTendik: item.pnsTendik || 0,
          nonAsnSerdikTendik: item.nonAsnSerdikTendik || 0,
          nonAsnMurniTendik: item.nonAsnMurniTendik || 0,
          nonAsnNonDapodikTendik: item.nonAsnNonDapodikTendik || 0,
        } : null;

        if (fromMap && user?.schoolId) {
          const fromSimpeg = await calculateFromSimpeg(user.schoolId);
          if (fromSimpeg) {
            setForm({
              ...fromMap,
              pnsGuruPai: fromSimpeg.guruPai.pns,
              pppkGuruPai: fromSimpeg.guruPai.pppk,
              pppkWGuruPai: fromSimpeg.guruPai.pppkW,
              nonAsnSerdikGuruPai: fromSimpeg.guruPai.nas,
              nonAsnMurniGuruPai: fromSimpeg.guruPai.nam,
              nonAsnNonDapodikGuruPai: fromSimpeg.guruPai.nan,
              pnsGuruPenjaskes: fromSimpeg.guruPenjaskes.pns,
              pppkGuruPenjaskes: fromSimpeg.guruPenjaskes.pppk,
              pppkWGuruPenjaskes: fromSimpeg.guruPenjaskes.pppkW,
              nonAsnSerdikGuruPenjaskes: fromSimpeg.guruPenjaskes.nas,
              nonAsnMurniGuruPenjaskes: fromSimpeg.guruPenjaskes.nam,
              nonAsnNonDapodikGuruPenjaskes: fromSimpeg.guruPenjaskes.nan,
              pnsGuruKelas: fromSimpeg.guruKelas.pns,
              pppkGuruKelas: fromSimpeg.guruKelas.pppk,
              pppkWGuruKelas: fromSimpeg.guruKelas.pppkW,
              nonAsnSerdikGuruKelas: fromSimpeg.guruKelas.nas,
              nonAsnMurniGuruKelas: fromSimpeg.guruKelas.nam,
              nonAsnNonDapodikGuruKelas: fromSimpeg.guruKelas.nan,
              pnsTendik: fromSimpeg.tendik.pns,
              nonAsnSerdikTendik: fromSimpeg.tendik.nas,
              nonAsnMurniTendik: fromSimpeg.tendik.nam,
              nonAsnNonDapodikTendik: fromSimpeg.tendik.nan,
            });
          }
        } else if (fromMap) {
          setForm(fromMap);
        }
      })
      .catch((e: any) => setError(e.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [user?.schoolId, calculateFromSimpeg]);

  const sum = (prefix: string, fields: string[]) => fields.reduce((a, f) => a + (Number(form[f]) || 0), 0);

  const totals = {
    guruPai: sum('', ['pnsGuruPai', 'pppkGuruPai', 'pppkWGuruPai', 'nonAsnSerdikGuruPai', 'nonAsnMurniGuruPai', 'nonAsnNonDapodikGuruPai']),
    guruPenjaskes: sum('', ['pnsGuruPenjaskes', 'pppkGuruPenjaskes', 'pppkWGuruPenjaskes', 'nonAsnSerdikGuruPenjaskes', 'nonAsnMurniGuruPenjaskes', 'nonAsnNonDapodikGuruPenjaskes']),
    guruKelas: sum('', ['pnsGuruKelas', 'pppkGuruKelas', 'pppkWGuruKelas', 'nonAsnSerdikGuruKelas', 'nonAsnMurniGuruKelas', 'nonAsnNonDapodikGuruKelas']),
    tendik: sum('', ['pnsTendik', 'nonAsnSerdikTendik', 'nonAsnMurniTendik', 'nonAsnNonDapodikTendik']),
  };

  // Kebutuhan ideal (contoh: 1 guru PAI per 1 sekolah, 1 guru penjaskes per 1 sekolah, 1 guru kelas per 20 siswa, 2 tendik)
  const kebutuhan = {
    guruPai: 1,
    guruPenjaskes: 1,
    guruKelas: Math.ceil((Number(form.jumlahSiswa) || 0) / 20),
    tendik: 2,
  };

  const selisih = (actual: number, ideal: number) => actual - ideal;

  const handleSave = async () => {
    if (!user?.schoolId || !user?.email) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        schoolId: user.schoolId,
        sekolah_id: user.schoolId,
        tahunPelajaran: form.tahunPelajaran || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        namaSekolah: school?.namaSekolah || user.schoolName || '',
        satuan_kerja: school?.namaSekolah || user.schoolName || '',
        jenjang: school?.jenjang || '',
        npsn: school?.npsn || user.schoolId,
        kepalaSekolah: school?.kepalaSekolah || '',
        ...form,
        updatedBy: user.email,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/firestore/employee_mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mapping?.id || undefined,
          data: payload,
          merge: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Data berhasil disimpan');
        setMapping(json);
      } else {
        setError(json.error || 'Gagal menyimpan');
      }
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const row = {
      'Satuan Kerja': school?.namaSekolah || user?.schoolName || '',
      'Kepala Sekolah': school?.kepalaSekolah || '',
      'Tahun Pelajaran': form.tahunPelajaran,
      'Jumlah Siswa': form.jumlahSiswa,
      'Jumlah Rombel': form.jumlahRombel,
      // Guru PAI
      'Real PTK Guru PAI': totals.guruPai,
      'PNS Guru PAI': form.pnsGuruPai,
      'PPPK Guru PAI': form.pppkGuruPai,
      'PPPK Paruh Waktu Guru PAI': form.pppkWGuruPai,
      'Non ASN Serdik Guru PAI': form.nonAsnSerdikGuruPai,
      'Non ASN Murni Guru PAI': form.nonAsnMurniGuruPai,
      'Non ASN Non Dapodik Guru PAI': form.nonAsnNonDapodikGuruPai,
      'Jumlah Guru PAI': totals.guruPai,
      'Kurang/Lebih Guru PAI': selisih(totals.guruPai, kebutuhan.guruPai),
      // Guru Penjaskes
      'Real PTK Guru Penjaskes': totals.guruPenjaskes,
      'PNS Guru Penjaskes': form.pnsGuruPenjaskes,
      'PPPK Guru Penjaskes': form.pppkGuruPenjaskes,
      'PPPK Paruh Waktu Guru Penjaskes': form.pppkWGuruPenjaskes,
      'Non ASN Serdik Guru Penjaskes': form.nonAsnSerdikGuruPenjaskes,
      'Non ASN Murni Guru Penjaskes': form.nonAsnMurniGuruPenjaskes,
      'Non ASN Non Dapodik Guru Penjaskes': form.nonAsnNonDapodikGuruPenjaskes,
      'Jumlah Guru Penjaskes': totals.guruPenjaskes,
      'Kurang/Lebih Guru Penjaskes': selisih(totals.guruPenjaskes, kebutuhan.guruPenjaskes),
      // Guru Kelas
      'Real PTK Guru Kelas': totals.guruKelas,
      'PNS Guru Kelas': form.pnsGuruKelas,
      'PPPK Guru Kelas': form.pppkGuruKelas,
      'PPPK Paruh Waktu Guru Kelas': form.pppkWGuruKelas,
      'Non ASN Serdik Guru Kelas': form.nonAsnSerdikGuruKelas,
      'Non ASN Murni Guru Kelas': form.nonAsnMurniGuruKelas,
      'Non ASN Non Dapodik Guru Kelas': form.nonAsnNonDapodikGuruKelas,
      'Jumlah Guru Kelas': totals.guruKelas,
      'Kurang/Lebih Guru Kelas': selisih(totals.guruKelas, kebutuhan.guruKelas),
      // Tendik
      'Real PTK Tendik': totals.tendik,
      'PNS/PPK Tendik': form.pnsTendik,
      'Non ASN Serdik Tendik': form.nonAsnSerdikTendik,
      'Non ASN Murni Tendik': form.nonAsnMurniTendik,
      'Non ASN Non Dapodik Tendik': form.nonAsnNonDapodikTendik,
      'Jumlah Tendik': totals.tendik,
      'Kurang/Lebih Tendik': selisih(totals.tendik, kebutuhan.tendik),
    };

    const columns = Object.keys(row).map(k => ({ header: k, key: k }));
    const filename = `mapping-pegawai-${(school?.namaSekolah || user?.schoolName || 'sekolah').replace(/\s+/g, '-')}-${(form.tahunPelajaran || '').replace('/', '-')}`;
    exportToExcel([row], columns, filename);
  };

  if (!user) return null;

  if (!user?.schoolId) {
    return (
      <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Mapping Pegawai">
      <SimpleAdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="p-6 max-w-3xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <MapPin className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h2 className="font-bold text-lg text-amber-800">Data Sekolah Operator Belum Terhubung</h2>
            <p className="text-amber-700 mt-2">Silakan hubungi Admin Kecamatan.</p>
          </div>
        </main>
      </div>
      </SimpleAdminLayout>
      </AuthGuard>
    );
  }

  // Hanya render jika data siap
  if (loading || !school) return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Mapping Pegawai">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Mapping Pegawai">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2"><MapPin className="w-5 h-5" /> Mapping Pegawai</h1>
          <div className="flex items-center gap-2">
            <button onClick={async () => {
              if (!user?.schoolId) return;
              const c = await calculateFromSimpeg(user.schoolId);
              if (c) setForm(f => ({
                ...f,
                pnsGuruPai: c.guruPai.pns, pppkGuruPai: c.guruPai.pppk,
                pppkWGuruPai: c.guruPai.pppkW, nonAsnSerdikGuruPai: c.guruPai.nas,
                nonAsnMurniGuruPai: c.guruPai.nam, nonAsnNonDapodikGuruPai: c.guruPai.nan,
                pnsGuruPenjaskes: c.guruPenjaskes.pns, pppkGuruPenjaskes: c.guruPenjaskes.pppk,
                pppkWGuruPenjaskes: c.guruPenjaskes.pppkW, nonAsnSerdikGuruPenjaskes: c.guruPenjaskes.nas,
                nonAsnMurniGuruPenjaskes: c.guruPenjaskes.nam, nonAsnNonDapodikGuruPenjaskes: c.guruPenjaskes.nan,
                pnsGuruKelas: c.guruKelas.pns, pppkGuruKelas: c.guruKelas.pppk,
                pppkWGuruKelas: c.guruKelas.pppkW, nonAsnSerdikGuruKelas: c.guruKelas.nas,
                nonAsnMurniGuruKelas: c.guruKelas.nam, nonAsnNonDapodikGuruKelas: c.guruKelas.nan,
                pnsTendik: c.tendik.pns, nonAsnSerdikTendik: c.tendik.nas,
                nonAsnMurniTendik: c.tendik.nam, nonAsnNonDapodikTendik: c.tendik.nan,
              }));
            }} className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
              <RotateCcw className="w-4 h-4" /> SIMPEG
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">&times;</button>
          </div>
        )}

        {/* Info Sekolah */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 text-sm space-y-1">
          <p><span className="text-muted-foreground">Satuan Kerja:</span> <span className="font-medium">{school.namaSekolah || '-'}</span></p>
          <p><span className="text-muted-foreground">Kepala Sekolah:</span> <span className="font-medium">{school.kepalaSekolah || '-'}</span></p>
          <p><span className="text-muted-foreground">Jenjang:</span> <span className="font-medium">{school.jenjang || '-'}</span></p>
          <p><span className="text-muted-foreground">NPSN:</span> <span className="font-medium">{school.npsn || user.schoolId}</span></p>
        </div>

        {/* Form Input */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-2 py-2 text-left border w-60">Kategori</th>
                <th className="px-2 py-2 text-center border">Real PTK</th>
                <th className="px-2 py-2 text-center border">PNS</th>
                <th className="px-2 py-2 text-center border">PPPK</th>
                <th className="px-2 py-2 text-center border">PPPK PW</th>
                <th className="px-2 py-2 text-center border">Non ASN Serdik</th>
                <th className="px-2 py-2 text-center border">Non ASN Murni</th>
                <th className="px-2 py-2 text-center border">Non ASN Non Dapodik</th>
                <th className="px-2 py-2 text-center border">Jumlah</th>
                <th className="px-2 py-2 text-center border">Kurang/Lebih</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Guru PAI */}
              <tr>
                <td className="px-2 py-1.5 border font-medium">Guru PAI</td>
                <td className="px-2 py-1.5 border text-center font-semibold">{totals.guruPai}</td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pnsGuruPai} onChange={e => setForm(f => ({ ...f, pnsGuruPai: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pppkGuruPai} onChange={e => setForm(f => ({ ...f, pppkGuruPai: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pppkWGuruPai} onChange={e => setForm(f => ({ ...f, pppkWGuruPai: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnSerdikGuruPai} onChange={e => setForm(f => ({ ...f, nonAsnSerdikGuruPai: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnMurniGuruPai} onChange={e => setForm(f => ({ ...f, nonAsnMurniGuruPai: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnNonDapodikGuruPai} onChange={e => setForm(f => ({ ...f, nonAsnNonDapodikGuruPai: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border text-center font-bold">{totals.guruPai}</td>
                <td className={`px-2 py-1.5 border text-center font-bold ${selisih(totals.guruPai, kebutuhan.guruPai) < 0 ? 'text-red-600' : selisih(totals.guruPai, kebutuhan.guruPai) > 0 ? 'text-green-600' : ''}`}>
                  {selisih(totals.guruPai, kebutuhan.guruPai) > 0 ? `+${selisih(totals.guruPai, kebutuhan.guruPai)}` : selisih(totals.guruPai, kebutuhan.guruPai)}
                </td>
              </tr>
              {/* Guru Penjaskes */}
              <tr>
                <td className="px-2 py-1.5 border font-medium">Guru Penjaskes</td>
                <td className="px-2 py-1.5 border text-center font-semibold">{totals.guruPenjaskes}</td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pnsGuruPenjaskes} onChange={e => setForm(f => ({ ...f, pnsGuruPenjaskes: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pppkGuruPenjaskes} onChange={e => setForm(f => ({ ...f, pppkGuruPenjaskes: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pppkWGuruPenjaskes} onChange={e => setForm(f => ({ ...f, pppkWGuruPenjaskes: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnSerdikGuruPenjaskes} onChange={e => setForm(f => ({ ...f, nonAsnSerdikGuruPenjaskes: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnMurniGuruPenjaskes} onChange={e => setForm(f => ({ ...f, nonAsnMurniGuruPenjaskes: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnNonDapodikGuruPenjaskes} onChange={e => setForm(f => ({ ...f, nonAsnNonDapodikGuruPenjaskes: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border text-center font-bold">{totals.guruPenjaskes}</td>
                <td className={`px-2 py-1.5 border text-center font-bold ${selisih(totals.guruPenjaskes, kebutuhan.guruPenjaskes) < 0 ? 'text-red-600' : selisih(totals.guruPenjaskes, kebutuhan.guruPenjaskes) > 0 ? 'text-green-600' : ''}`}>
                  {selisih(totals.guruPenjaskes, kebutuhan.guruPenjaskes) > 0 ? `+${selisih(totals.guruPenjaskes, kebutuhan.guruPenjaskes)}` : selisih(totals.guruPenjaskes, kebutuhan.guruPenjaskes)}
                </td>
              </tr>
              {/* Guru Kelas */}
              <tr>
                <td className="px-2 py-1.5 border font-medium">Guru Kelas</td>
                <td className="px-2 py-1.5 border text-center font-semibold">{totals.guruKelas}</td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pnsGuruKelas} onChange={e => setForm(f => ({ ...f, pnsGuruKelas: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pppkGuruKelas} onChange={e => setForm(f => ({ ...f, pppkGuruKelas: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.pppkWGuruKelas} onChange={e => setForm(f => ({ ...f, pppkWGuruKelas: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnSerdikGuruKelas} onChange={e => setForm(f => ({ ...f, nonAsnSerdikGuruKelas: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnMurniGuruKelas} onChange={e => setForm(f => ({ ...f, nonAsnMurniGuruKelas: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnNonDapodikGuruKelas} onChange={e => setForm(f => ({ ...f, nonAsnNonDapodikGuruKelas: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border text-center font-bold">{totals.guruKelas}</td>
                <td className={`px-2 py-1.5 border text-center font-bold ${selisih(totals.guruKelas, kebutuhan.guruKelas) < 0 ? 'text-red-600' : selisih(totals.guruKelas, kebutuhan.guruKelas) > 0 ? 'text-green-600' : ''}`}>
                  {selisih(totals.guruKelas, kebutuhan.guruKelas) > 0 ? `+${selisih(totals.guruKelas, kebutuhan.guruKelas)}` : selisih(totals.guruKelas, kebutuhan.guruKelas)}
                </td>
              </tr>
              {/* Tendik */}
              <tr>
                <td className="px-2 py-1.5 border font-medium">Tendik</td>
                <td className="px-2 py-1.5 border text-center font-semibold">{totals.tendik}</td>
                <td className="px-2 py-1.5 border">{/* PNS Tendik */}
                  <input type="number" min="0" value={form.pnsTendik} onChange={e => setForm(f => ({ ...f, pnsTendik: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" />
                </td>
                <td className="px-2 py-1.5 border text-center text-muted-foreground">-</td>
                <td className="px-2 py-1.5 border text-center text-muted-foreground">-</td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnSerdikTendik} onChange={e => setForm(f => ({ ...f, nonAsnSerdikTendik: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnMurniTendik} onChange={e => setForm(f => ({ ...f, nonAsnMurniTendik: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border"><input type="number" min="0" value={form.nonAsnNonDapodikTendik} onChange={e => setForm(f => ({ ...f, nonAsnNonDapodikTendik: Number(e.target.value) }))} className="w-full text-center bg-transparent outline-none" /></td>
                <td className="px-2 py-1.5 border text-center font-bold">{totals.tendik}</td>
                <td className={`px-2 py-1.5 border text-center font-bold ${selisih(totals.tendik, kebutuhan.tendik) < 0 ? 'text-red-600' : selisih(totals.tendik, kebutuhan.tendik) > 0 ? 'text-green-600' : ''}`}>
                  {selisih(totals.tendik, kebutuhan.tendik) > 0 ? `+${selisih(totals.tendik, kebutuhan.tendik)}` : selisih(totals.tendik, kebutuhan.tendik)}
                </td>
              </tr>
              {/* Data Umum */}
              <tr className="bg-blue-50 dark:bg-blue-950">
                <td className="px-2 py-1.5 border font-medium">Data Umum</td>
                <td colSpan={2} className="px-2 py-1.5 border">
                  <label className="text-muted-foreground mr-2">Tahun Pelajaran:</label>
                  <input type="text" value={form.tahunPelajaran} onChange={e => setForm(f => ({ ...f, tahunPelajaran: e.target.value }))} className="w-24 text-center bg-white rounded border px-1" placeholder="2025/2026" />
                </td>
                <td colSpan={2} className="px-2 py-1.5 border">
                  <label className="text-muted-foreground mr-2">Jumlah Siswa:</label>
                  <input type="number" min="0" value={form.jumlahSiswa} onChange={e => setForm(f => ({ ...f, jumlahSiswa: Number(e.target.value) }))} className="w-20 text-center bg-white rounded border px-1" />
                </td>
                <td colSpan={2} className="px-2 py-1.5 border">
                  <label className="text-muted-foreground mr-2">Jumlah Rombel:</label>
                  <input type="number" min="0" value={form.jumlahRombel} onChange={e => setForm(f => ({ ...f, jumlahRombel: Number(e.target.value) }))} className="w-20 text-center bg-white rounded border px-1" />
                </td>
                <td colSpan={2} className="px-2 py-1.5 border text-xs text-muted-foreground">
                  Kebutuhan Guru Kelas: 1 per 20 siswa ({kebutuhan.guruKelas})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
