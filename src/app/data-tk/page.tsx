'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Baby, Building2, MapPin, Loader2 } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { db } from '@/lib/firebase';
import { getAllDocs } from '@/lib/firestore';

interface SchoolItem {
  name: string;
  npsn: string;
  status: string;
  akreditasi: string;
  address: string;
  desa: string;
}

const fallbackTK: SchoolItem[] = [
  { name: 'TK NEGERI LEMAHABANG', npsn: '20270605', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wakhid Hasyim, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN' },
  { name: 'TK AISYIYAH LEMAHABANG', npsn: '20254372', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 25, Lemahabang', desa: 'LEMAHABANG' },
  { name: 'TK AL-AQSO', npsn: '20254376', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Desa Tuk Karangsuwung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG' },
  { name: 'TK AL-IRSYAD AL-ISLAMIYYAH', npsn: '20254373', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Syekh Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON' },
  { name: 'TK BPP KENANGA', npsn: '20254374', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Abdurahman Saleh No. 24, Asem', desa: 'ASEM' },
  { name: 'TK GELATIK', npsn: '20254370', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Raya Dr. Wahidin No. 57A, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN' },
  { name: 'TK MELATI', npsn: '20254378', status: 'SWASTA', akreditasi: 'B', address: 'Jl. Desa Wangkelang, Wangkelang', desa: 'WANGKELANG' },
  { name: 'TK MUSLIMAT NU', npsn: '20254375', status: 'SWASTA', akreditasi: 'B', address: 'Jl. R.A. Kartini No. 5, Lemahabang', desa: 'LEMAHABANG' },
];

export default function DataTKPage() {
  const [schools, setSchools] = useState<SchoolItem[]>(fallbackTK);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    async function fetch() {
      try {
        const data = await getAllDocs('schools');
        if (data.length > 0) {
          const filtered: SchoolItem[] = data
            .filter((s: any) => s.jenjang === 'TK')
            .map((s: any) => ({
              name: s.name || s.nama || '',
              npsn: s.npsn || '-',
              status: s.status || 'NEGERI',
              akreditasi: s.akreditasi || '-',
              address: s.alamat || '',
              desa: s.desa || '',
            }));
          if (filtered.length > 0) setSchools(filtered);
        }
      } catch {} finally { setLoading(false); }
    }
    fetch();
  }, []);

  const totalNegeri = schools.filter(s => s.status === 'NEGERI').length;
  const totalSwasta = schools.filter(s => s.status === 'SWASTA').length;

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
              <Baby className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Data TK</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Data Taman Kanak-Kanak</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Baby className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{schools.length}</p>
                <p className="text-xs text-gray-500">Total TK</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{totalNegeri}</p>
                <p className="text-xs text-gray-500">Negeri</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{totalSwasta}</p>
                <p className="text-xs text-gray-500">Swasta</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-[#0d3b66]">Daftar TK</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari TK..."
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
                  <th className="px-5 py-3 font-semibold text-gray-600">Nama TK</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">NPSN</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
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
                    <tr key={school.npsn} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-[#0d3b66]">{school.name}</td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">{school.npsn}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.status === 'NEGERI' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.akreditasi === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {school.akreditasi}
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

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0d3b66] mb-2">Informasi</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Data ini merupakan informasi pokok Taman Kanak-Kanak (TK) di lingkungan Kecamatan Lemahabang,
            Kabupaten Cirebon. Data bersumber dari Dapodik Kemendikdasmen. Untuk informasi lebih lanjut,
            silakan menghubungi operator sekolah masing-masing atau Dinas Pendidikan Kabupaten Cirebon.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
