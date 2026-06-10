'use client';

import { useState, useEffect, useMemo } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';

export default function MappingPegawaiPublicPage() {
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
      fetch('/api/firestore/employee_mappings?limit=10000').then(r => r.json()),
      fetch('/api/firestore/schools').then(r => r.json()),
    ])
      .then(([sJson, scJson]) => {
        if (sJson.items) setData(sJson.items);
        if (scJson.items) setSchools(scJson.items);
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = data;
    if (filterJenjang !== 'Semua') result = result.filter(d => d.jenjang === filterJenjang);
    if (filterStatus !== 'Semua') result = result.filter(d => schoolStatusMap[d.schoolId] === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d => d.namaSekolah?.toLowerCase().includes(q));
    }
    return result;
  }, [data, filterJenjang, filterStatus, search, schoolStatusMap]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Memuat data mapping...</span></div>
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
            <MapPin className="w-6 h-6 text-blue-200" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Mapping Pegawai</h1>
          </div>
          <p className="text-sm text-blue-200">Pemetaan kebutuhan pegawai per sekolah/lembaga</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah/lembaga..." value={search} onChange={e => setSearch(e.target.value)}
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

        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada data mapping ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white dark:bg-gray-800 rounded-xl border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left">Sekolah</th>
                  <th className="px-3 py-2 text-center">Jenjang</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-center">Rombel</th>
                  <th className="px-3 py-2 text-center">Siswa</th>
                  <th className="px-3 py-2 text-center">Tersedia</th>
                  <th className="px-3 py-2 text-center">Kebutuhan</th>
                  <th className="px-3 py-2 text-center">+/-</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((m) => {
                  const selisih = (m.totalPegawaiTersedia || 0) - (m.totalKebutuhanIdeal || 0);
                  const statusMap = selisih < 0 ? 'Kurang' : selisih > 0 ? 'Lebih' : 'Cukup';
                  return (
                    <tr key={m.id} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{m.namaSekolah}</td>
                      <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${m.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' : m.jenjang === 'TK' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{m.jenjang}</span></td>
                      <td className="px-3 py-2 text-center text-xs">{m.statusSekolah}</td>
                      <td className="px-3 py-2 text-center">{m.jumlahRombel || 0}</td>
                      <td className="px-3 py-2 text-center">{m.jumlahSiswa || 0}</td>
                      <td className="px-3 py-2 text-center">{m.totalPegawaiTersedia || 0}</td>
                      <td className="px-3 py-2 text-center">{m.totalKebutuhanIdeal || 0}</td>
                      <td className={`px-3 py-2 text-center font-bold ${selisih < 0 ? 'text-red-600' : selisih > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {selisih > 0 ? `+${selisih}` : selisih}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          statusMap === 'Cukup' ? 'bg-green-100 text-green-700' :
                          statusMap === 'Kurang' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>{statusMap}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
