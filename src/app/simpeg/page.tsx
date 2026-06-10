'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Loader2, Search } from 'lucide-react';

export default function SimpegPublicPage() {
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
      fetch('/api/firestore/employees?limit=10000').then(r => r.json()),
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

    const jabatan: Record<string, number> = {};
    const statusPegawai: Record<string, number> = {};
    const perSekolah: Record<string, any> = {};

    filtered.forEach(d => {
      const j = d.jabatan || 'Unknown';
      jabatan[j] = (jabatan[j] || 0) + 1;
      const sp = d.statusPegawai || 'Unknown';
      statusPegawai[sp] = (statusPegawai[sp] || 0) + 1;
      const sekolah = d.sekolah || d.namaSekolah || 'Unknown';
      if (!perSekolah[sekolah]) perSekolah[sekolah] = { total: 0 };
      perSekolah[sekolah].total++;
    });

    return {
      total: filtered.length,
      jabatan,
      statusPegawai,
      perSekolah,
      pns: (statusPegawai['PNS'] || 0) + (statusPegawai['Pns'] || 0),
      pppk: (statusPegawai['PPPK'] || 0) + (statusPegawai['Pppk'] || 0),
      honorer: (statusPegawai['Honorer'] || 0) + (statusPegawai['GTT'] || 0) + (statusPegawai['GTY'] || 0),
    };
  }, [data, filterJenjang, filterStatus, search, schoolStatusMap]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Memuat data SIMPEG...</span></div>
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
            <BookOpen className="w-6 h-6 text-blue-200" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">SIMPEG</h1>
          </div>
          <p className="text-sm text-blue-200">Sistem Informasi Manajemen Pegawai</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari pegawai/sekolah..." value={search} onChange={e => setSearch(e.target.value)}
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
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-gray-900">{rekap.total}</p><p className="text-xs text-muted-foreground">Total Pegawai</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-blue-700">{rekap.pns}</p><p className="text-xs text-muted-foreground">PNS</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-purple-700">{rekap.pppk}</p><p className="text-xs text-muted-foreground">PPPK</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-amber-700">{rekap.honorer}</p><p className="text-xs text-muted-foreground">Honorer</p></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-900"><h3 className="font-semibold text-sm">Jabatan</h3></div>
            <div className="divide-y text-sm">
              {Object.entries(rekap.jabatan).sort().map(([jab, count]) => (
                <div key={jab} className="flex justify-between px-4 py-2"><span>{jab}</span><span className="font-semibold">{count}</span></div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-900"><h3 className="font-semibold text-sm">Status Pegawai</h3></div>
            <div className="divide-y text-sm">
              {Object.entries(rekap.statusPegawai).sort().map(([sp, count]) => (
                <div key={sp} className="flex justify-between px-4 py-2"><span>{sp}</span><span className="font-semibold">{count}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
