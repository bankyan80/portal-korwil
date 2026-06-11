'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Loader2, Search } from 'lucide-react';

export default function SimdawaPublicPage() {
  const [data, setData] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const schoolStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of schools) map[s.id] = s.statusSekolah;
    return map;
  }, [schools]);

  useEffect(() => {
    Promise.all([
      fetch('/api/firestore/students?limit=10000').then(r => r.json()),
      fetch('/api/firestore/schools').then(r => r.json()),
    ])
      .then(([sJson, scJson]) => {
        if (sJson.items) setData(sJson.items);
        if (scJson.items) setSchools(scJson.items);
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  const rekap = useMemo(() => {
    let filtered = data;
    if (filterJenjang !== 'Semua') filtered = filtered.filter(d => d.jenjang === filterJenjang);
    if (filterStatus !== 'Semua') filtered = filtered.filter(d => schoolStatusMap[d.schoolId] === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d => d.nama?.toLowerCase().includes(q) || d.sekolah?.toLowerCase().includes(q));
    }

    const jenjangBreakdown: Record<string, any> = {};
    const sekolahBreakdown: Record<string, any> = {};
    const kelasBreakdown: Record<string, any> = {};
    const kelompokBreakdown: Record<string, any> = {};

    filtered.forEach(d => {
      const jenjang = d.jenjang || 'Unknown';
      if (!jenjangBreakdown[jenjang]) jenjangBreakdown[jenjang] = { total: 0, l: 0, p: 0, aktif: 0, mutasiMasuk: 0, mutasiKeluar: 0, alumni: 0 };
      jenjangBreakdown[jenjang].total++;
      if (d.jenisKelamin === 'L' || d.jenisKelamin === 'Laki-laki') jenjangBreakdown[jenjang].l++;
      else jenjangBreakdown[jenjang].p++;
      if (d.statusSiswa === 'Aktif') jenjangBreakdown[jenjang].aktif++;
      if (d.statusSiswa === 'Mutasi Masuk') jenjangBreakdown[jenjang].mutasiMasuk++;
      if (d.statusSiswa === 'Mutasi Keluar') jenjangBreakdown[jenjang].mutasiKeluar++;
      if (d.statusSiswa === 'Lulus/Alumni') jenjangBreakdown[jenjang].alumni++;

      const sekolah = d.sekolah || d.namaSekolah || 'Unknown';
      if (!sekolahBreakdown[sekolah]) sekolahBreakdown[sekolah] = { total: 0, l: 0, p: 0 };
      sekolahBreakdown[sekolah].total++;
      if (d.jenisKelamin === 'L' || d.jenisKelamin === 'Laki-laki') sekolahBreakdown[sekolah].l++;
      else sekolahBreakdown[sekolah].p++;

      if (jenjang === 'SD' && d.kelas != null) {
        const k = `Kelas ${d.kelas}`;
        if (!kelasBreakdown[k]) kelasBreakdown[k] = { total: 0, l: 0, p: 0 };
        kelasBreakdown[k].total++;
        if (d.jenisKelamin === 'L' || d.jenisKelamin === 'Laki-laki') kelasBreakdown[k].l++;
        else kelasBreakdown[k].p++;
      }

      if ((jenjang === 'TK' || jenjang === 'KB') && d.kelompok != null) {
        const k = `Kelompok ${d.kelompok}`;
        if (!kelompokBreakdown[k]) kelompokBreakdown[k] = { total: 0, l: 0, p: 0 };
        kelompokBreakdown[k].total++;
        if (d.jenisKelamin === 'L' || d.jenisKelamin === 'Laki-laki') kelompokBreakdown[k].l++;
        else kelompokBreakdown[k].p++;
      }
    });

    return { total: filtered.length, jenjangBreakdown, sekolahBreakdown, kelasBreakdown, kelompokBreakdown };
  }, [data, filterJenjang, filterStatus, search, schoolStatusMap]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Memuat data SIMDAWA...</span></div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-red-600">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-blue-200" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">SIMDAWA</h1>
          </div>
          <p className="text-sm text-blue-200">Sistem Informasi Manajemen Data Warga Sekolah</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari siswa/sekolah..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800" />
          </div>
          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
            <option value="Semua">Semua Jenjang</option>
            <option value="SD">SD</option>
            <option value="TK">TK</option>
            <option value="KB">KB</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
            <option value="Semua">Negeri/Swasta</option>
            <option value="Negeri">Negeri</option>
            <option value="Swasta">Swasta</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-gray-900">{rekap.total}</p><p className="text-xs text-muted-foreground">Total Siswa</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-blue-700">{rekap.jenjangBreakdown['SD']?.total || 0}</p><p className="text-xs text-muted-foreground">SD</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-purple-700">{rekap.jenjangBreakdown['TK']?.total || 0}</p><p className="text-xs text-muted-foreground">TK</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-green-700">{rekap.jenjangBreakdown['KB']?.total || 0}</p><p className="text-xs text-muted-foreground">KB</p></div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-900"><h3 className="font-semibold text-sm">Rekap per Sekolah</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left">Sekolah</th><th className="px-3 py-2 text-center">Total</th><th className="px-3 py-2 text-center">L</th><th className="px-3 py-2 text-center">P</th></tr></thead>
              <tbody className="divide-y">
                {Object.entries(rekap.sekolahBreakdown).sort().map(([sekolah, vals]: any) => (
                  <tr key={sekolah} className="hover:bg-muted/50"><td className="px-3 py-2 font-medium">{sekolah}</td><td className="px-3 py-2 text-center">{vals.total}</td><td className="px-3 py-2 text-center">{vals.l}</td><td className="px-3 py-2 text-center">{vals.p}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(rekap.kelasBreakdown).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-900"><h3 className="font-semibold text-sm">Rekap per Kelas (SD)</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left">Kelas</th><th className="px-3 py-2 text-center">Total</th><th className="px-3 py-2 text-center">L</th><th className="px-3 py-2 text-center">P</th></tr></thead>
                  <tbody className="divide-y">
                    {Object.entries(rekap.kelasBreakdown).sort().map(([kelas, vals]: any) => (
                      <tr key={kelas} className="hover:bg-muted/50"><td className="px-3 py-2 font-medium">{kelas}</td><td className="px-3 py-2 text-center">{vals.total}</td><td className="px-3 py-2 text-center">{vals.l}</td><td className="px-3 py-2 text-center">{vals.p}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {Object.keys(rekap.kelompokBreakdown).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-900"><h3 className="font-semibold text-sm">Rekap per Kelompok (TK/KB)</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left">Kelompok</th><th className="px-3 py-2 text-center">Total</th><th className="px-3 py-2 text-center">L</th><th className="px-3 py-2 text-center">P</th></tr></thead>
                  <tbody className="divide-y">
                    {Object.entries(rekap.kelompokBreakdown).sort().map(([kelompok, vals]: any) => (
                      <tr key={kelompok} className="hover:bg-muted/50"><td className="px-3 py-2 font-medium">{kelompok}</td><td className="px-3 py-2 text-center">{vals.total}</td><td className="px-3 py-2 text-center">{vals.l}</td><td className="px-3 py-2 text-center">{vals.p}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
