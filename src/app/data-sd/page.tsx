'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, School, Building2, MapPin, Loader2 } from 'lucide-react';
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

const fallbackSD: SchoolItem[] = [
  { name: 'SD NEGERI 1 ASEM', npsn: '20215216', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Abdurachman Saleh No. 328, Asem', desa: 'ASEM' },
  { name: 'SD NEGERI 1 BELAWA', npsn: '20215230', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cikuya 1, Belawa', desa: 'BELAWA' },
  { name: 'SD NEGERI 2 BELAWA', npsn: '20215564', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Inpres Blok A, Belawa', desa: 'BELAWA' },
  { name: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', status: 'NEGERI', akreditasi: 'B', address: 'Jl. K.H. Hasyim Asyari No. 07, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON' },
  { name: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', status: 'NEGERI', akreditasi: 'A', address: 'Jl. KH. Hasyim Asyari No. 500, Cipeujeuh Kulon', desa: 'CIPEUJEUH KULON' },
  { name: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 62, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN' },
  { name: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', status: 'NEGERI', akreditasi: 'A', address: 'Jl. MT. Haryono No. 3B, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN' },
  { name: 'SD NEGERI 3 CIPEUJEUH WETAN', npsn: '20214479', status: 'NEGERI', akreditasi: 'B', address: 'Jl. KH. Wahid Hasyim No. 66, Cipeujeuh Wetan', desa: 'CIPEUJEUH WETAN' },
  { name: 'SD NEGERI 1 LEMAHABANG', npsn: '20215162', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Ki Hajar Dewantoro No. 35, Lemahabang', desa: 'LEMAHABANG' },
  { name: 'SD NEGERI 2 LEMAHABANG', npsn: '20214656', status: 'NEGERI', akreditasi: 'A', address: 'Jl. R.A. Kartini No. 26, Lemahabang', desa: 'LEMAHABANG' },
  { name: 'SD NEGERI 1 LEMAHABANG KULON', npsn: '20215161', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Syech Lemahabang No. 5, Lemahabang Kulon', desa: 'LEMAHABANG KULON' },
  { name: 'SD NEGERI 1 LEUWIDINGDING', npsn: '20215164', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Abdurahman Saleh, Leuwidingding', desa: 'LEUWIDINGDING' },
  { name: 'SD NEGERI 1 PICUNGPUGUR', npsn: '20246442', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Desa Picungpugur, Picungpugur', desa: 'PICUNGPUGUR' },
  { name: 'SD NEGERI 1 SARAJAYA', npsn: '20215517', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya No. 63, Sarajaya', desa: 'SARAJAYA' },
  { name: 'SD NEGERI 2 SARAJAYA', npsn: '20214726', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sarajaya Subur No. 1, Sarajaya', desa: 'SARAJAYA' },
  { name: 'SD NEGERI 1 SIGONG', npsn: '20215506', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pelita No. 101, Sigong', desa: 'SIGONG' },
  { name: 'SD NEGERI 3 SIGONG', npsn: '20214570', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Raya Sigong, Sigong', desa: 'SIGONG' },
  { name: 'SD NEGERI 4 SIGONG', npsn: '20244513', status: 'NEGERI', akreditasi: 'B', address: 'Jl. Cantilan, Sigong', desa: 'SIGONG' },
  { name: 'SD NEGERI 1 SINDANGLAUT', npsn: '20215464', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Arief Rahman Hakim No. 24, Sindanglaut', desa: 'SINDANGLAUT' },
  { name: 'SD NEGERI 1 TUK KARANGSUWUNG', npsn: '20246445', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Pulo Undrus Ujung, Tuk Karangsuwung', desa: 'TUK KARANGSUWUNG' },
  { name: 'SD NEGERI 1 WANGKELANG', npsn: '20215584', status: 'NEGERI', akreditasi: 'A', address: 'Jl. Raya Wangkelang No. 40, Wangkelang', desa: 'WANGKELANG' },
  { name: 'SD IT AL IRSYAD AL ISLAMIYYAH', npsn: '20215221', status: 'SWASTA', akreditasi: 'A', address: 'Jl. Syech Lemahabang No. 54, Lemahabang Kulon', desa: 'LEMAHABANG KULON' },
];

export default function DataSDPage() {
  const [schools, setSchools] = useState<SchoolItem[]>(fallbackSD);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    async function fetch() {
      try {
        const data = await getAllDocs('schools');
        if (data.length > 0) {
          const filtered: SchoolItem[] = data
            .filter((s: any) => s.jenjang === 'SD')
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
              <School className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Data SD</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Data Sekolah Dasar</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <School className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{schools.length}</p>
                <p className="text-xs text-gray-500">Total SD</p>
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
            <h3 className="font-semibold text-[#0d3b66]">Daftar SD</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
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
                  <th className="px-5 py-3 font-semibold text-gray-600">Nama Sekolah</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">NPSN</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Akreditasi</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Alamat</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((school, i) => (
                  <tr key={school.npsn} className="hover:bg-blue-50/50 transition-colors">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0d3b66] mb-2">Informasi</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Data ini merupakan informasi pokok Sekolah Dasar (SD) di lingkungan Kecamatan Lemahabang,
            Kabupaten Cirebon. Data bersumber dari Dapodik Kemendikdasmen. Untuk informasi lebih lanjut,
            silakan menghubungi operator sekolah masing-masing atau Dinas Pendidikan Kabupaten Cirebon.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
