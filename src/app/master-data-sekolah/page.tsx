'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, School, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SchoolData {
  id: string;
  namaSekolah: string;
  npsn: string;
  jenjang: string;
  statusSekolah: string;
  desa: string;
  kecamatan: string;
  kepalaSekolah: string;
  jumlahRombel: number;
  jumlahSiswa: number;
  jumlahGuru: number;
  jumlahTendik: number;
  isActive: boolean;
}

export default function MasterDataSekolahPage() {
  const [data, setData] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  useEffect(() => {
    fetch('/api/firestore/schools')
      .then(r => r.json())
      .then(json => {
        if (json.items) setData(json.items as SchoolData[]);
        else if (json.data) setData([json.data] as SchoolData[]);
        else setData([]);
      })
      .catch(() => setError('Gagal memuat data sekolah'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = data;
    if (filterJenjang !== 'Semua') result = result.filter(d => d.jenjang === filterJenjang);
    if (filterStatus !== 'Semua') result = result.filter(d => d.statusSekolah === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.namaSekolah?.toLowerCase().includes(q) ||
        d.npsn?.includes(q) ||
        d.desa?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, filterJenjang, filterStatus, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Memuat data sekolah...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-sm text-blue-600 hover:underline">Coba lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <School className="w-6 h-6 text-blue-200" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Master Data Sekolah</h1>
          </div>
          <p className="text-sm text-blue-200">Data satuan pendidikan Kecamatan Lemahabang</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Cari nama sekolah, NPSN, atau desa..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800"
            />
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
            <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada data sekolah ditemukan</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white">{s.namaSekolah}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' :
                        s.jenjang === 'TK' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>{s.jenjang}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        s.statusSekolah === 'Negeri' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>{s.statusSekolah}</span>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground space-y-0.5">
                      <p>NPSN: {s.npsn} • {s.desa}, {s.kecamatan}</p>
                      <p>Kepala Sekolah: {s.kepalaSekolah || '-'}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Rombel: {s.jumlahRombel || 0}</span>
                      <span>Siswa: {s.jumlahSiswa || 0}</span>
                      <span>Guru: {s.jumlahGuru || 0}</span>
                      <span>Tendik: {s.jumlahTendik || 0}</span>
                    </div>
                  </div>
                  <Link href={`/master-data-sekolah/${s.id}`}
                    className="text-sm font-medium text-blue-700 hover:text-blue-800 shrink-0">
                    Detail →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Menampilkan {filtered.length} dari {data.length} sekolah/lembaga
        </div>
      </div>
    </div>
  );
}
