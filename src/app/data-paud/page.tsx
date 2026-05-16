'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, GraduationCap, Building2, MapPin, Loader2 } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { db } from '@/lib/firebase';
import { getAllDocs } from '@/lib/firestore';

interface SchoolItem {
  name: string;
  npsn: string;
  status: string;
  akreditasi: string;
  jenis: string;
  address: string;
  desa: string;
}

const fallbackPAUD: SchoolItem[] = [
  { name: 'KB A.H. PLUS', npsn: '70039880', status: 'SWASTA', akreditasi: '-', jenis: 'KB', address: 'Jl. Pelita Dusun 4, Sigong', desa: 'SIGONG' },
  { name: 'KB AMALIA SALSABILA', npsn: '69804039', status: 'SWASTA', akreditasi: 'B', jenis: 'KB', address: 'Jl. K.H. Hasyim Asyari No. 112, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON' },
  { name: 'KB AZ-ZAHRA', npsn: '69804068', status: 'SWASTA', akreditasi: 'B', jenis: 'KB', address: 'Jl. Pelita Dusun 02, Sigong', desa: 'SIGONG' },
  { name: 'KB MUTIARA', npsn: '70044538', status: 'SWASTA', akreditasi: '-', jenis: 'KB', address: 'Jl. KH. Hasyim Asyari No. 48, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN' },
  { name: 'KB PALAPA', npsn: '69870486', status: 'SWASTA', akreditasi: '-', jenis: 'KB', address: 'Jl. Syech Lemahabang, Lemahabang Kulon', desa: 'LEMAHABANG KULON' },
  { name: 'KB PERMATA BUNDA', npsn: '70024652', status: 'SWASTA', akreditasi: 'C', jenis: 'KB', address: 'Jl. Palasah Nunggal, Picungpugur', desa: 'PICUNGPUGUR' },
  { name: 'PAUD AL HAMBRA', npsn: '69947715', status: 'SWASTA', akreditasi: 'C', jenis: 'KB', address: 'Desa Lemahabang, Lemahabang', desa: 'LEMAHABANG' },
  { name: 'PAUD AL-HIDAYAH', npsn: '69870488', status: 'SWASTA', akreditasi: 'C', jenis: 'KB', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG' },
  { name: 'PAUD AL-HUSNA', npsn: '69870479', status: 'SWASTA', akreditasi: 'B', jenis: 'KB', address: 'Jl. Mbah Ardisela Desa Asem, Asem', desa: 'ASEM' },
  { name: 'PAUD AMANAH', npsn: '69870482', status: 'SWASTA', akreditasi: 'B', jenis: 'KB', address: 'Jl. Sidaresmi No. 1, Lemahabang Kulon', desa: 'LEMAHABANG KULON' },
  { name: 'PAUD AN NAIM', npsn: '69870484', status: 'SWASTA', akreditasi: 'C', jenis: 'KB', address: 'Blok Kliwon, Sindanglaut', desa: 'SINDANGLAUT' },
  { name: 'PAUD ASY-SYAFIIYAH', npsn: '69870485', status: 'SWASTA', akreditasi: 'C', jenis: 'KB', address: 'Jl. Stasiun No. 15, Lemahabang Kulon', desa: 'LEMAHABANG KULON' },
  { name: 'PAUD BUDGENVIL', npsn: '69870489', status: 'SWASTA', akreditasi: 'B', jenis: 'KB', address: 'Jl. Inpres, Belawa', desa: 'BELAWA' },
  { name: 'PAUD TUNAS HARAPAN', npsn: '69870490', status: 'SWASTA', akreditasi: 'C', jenis: 'KB', address: 'Blok Pahing, Wangkelang', desa: 'WANGKELANG' },
  { name: 'PAUD SPS MELATI', npsn: '69804044', status: 'SWASTA', akreditasi: 'C', jenis: 'SPS', address: 'Dusun 02, Sarajaya', desa: 'SARAJAYA' },
];

export default function DataPAUDPage() {
  const [schools, setSchools] = useState<SchoolItem[]>(fallbackPAUD);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    async function fetch() {
      try {
        const data = await getAllDocs('schools');
        if (data.length > 0) {
          const filtered: SchoolItem[] = data
            .filter((s: any) => s.jenjang === 'KB' || s.jenjang === 'PAUD' || s.jenjang === 'SPS')
            .map((s: any) => ({
              name: s.name || s.nama || '',
              npsn: s.npsn || '-',
              status: s.status || 'SWASTA',
              akreditasi: s.akreditasi || '-',
              jenis: s.jenjang || 'KB',
              address: s.alamat || '',
              desa: s.desa || '',
            }));
          if (filtered.length > 0) setSchools(filtered);
        }
      } catch (e) { console.error('Gagal memuat data PAUD:', e); } finally { setLoading(false); }
    }
    fetch();
  }, []);

  const filtered = schools.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search) || s.desa.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a
              href="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-yellow-400" />
               <h1 className="text-sm font-bold text-white uppercase tracking-wide">Data KB</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Data KB</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{schools.length}</p>
                <p className="text-xs text-gray-500">Total PAUD</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{schools.filter(s => s.jenis === 'KB').length}</p>
                <p className="text-xs text-gray-500">Kelompok Belajar</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{schools.filter(s => s.jenis === 'SPS').length}</p>
                <p className="text-xs text-gray-500">SPS</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-[#0d3b66]">Daftar PAUD</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari PAUD..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Nama PAUD</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">NPSN</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Jenis</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Akreditasi</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Alamat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(() => {
                  if (loading) return (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />Memuat data...
                    </td></tr>
                  );
                  if (filtered.length === 0) return (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada data</td></tr>
                  );
                  return filtered.map((school, i) => (
                    <tr key={school.npsn} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-[#0d3b66]">{school.name}</td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">{school.npsn}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.jenis === 'KB' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                          {school.jenis}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.akreditasi === 'B' ? 'bg-blue-100 text-blue-700' : school.akreditasi === 'C' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                          {school.akreditasi || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {school.address}
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0d3b66] mb-2">Informasi</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Data ini merupakan informasi pokok Pendidikan Anak Usia Dini (PAUD) di lingkungan Kecamatan Lemahabang,
            Kabupaten Cirebon. Data bersumber dari Dapodik Kemendikdasmen. Untuk informasi lebih lanjut,
            silakan menghubungi operator masing-masing atau Dinas Pendidikan Kabupaten Cirebon.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
