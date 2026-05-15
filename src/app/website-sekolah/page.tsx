'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Globe, Search, ExternalLink, School, MapPin } from 'lucide-react';
import Footer from '@/components/portal/Footer';

interface SekolahWebsite {
  nama: string;
  npsn: string;
  jenjang: string;
  desa: string;
  url: string;
  status: 'aktif' | 'tidak_aktif';
}

const sekolahWebsites: SekolahWebsite[] = [
  { nama: 'SD NEGERI 1 ASEM', npsn: '20215216', jenjang: 'SD', desa: 'ASEM', url: 'https://sdn1asem.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 BELAWA', npsn: '20215230', jenjang: 'SD', desa: 'BELAWA', url: 'https://sdn1belawa.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 2 BELAWA', npsn: '20215564', jenjang: 'SD', desa: 'BELAWA', url: 'https://sdn2belawa.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 CIPEUJEUH KULON', npsn: '20215287', jenjang: 'SD', desa: 'CIPEUJEUH KULON', url: 'https://sdn1cipeujeuhkulon.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 2 CIPEUJEUH KULON', npsn: '20215381', jenjang: 'SD', desa: 'CIPEUJEUH KULON', url: 'https://sdn2cipeujeuhkulon.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 CIPEUJEUH WETAN', npsn: '20215286', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', url: 'https://sdn1cipeujeuhwetan.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 2 CIPEUJEUH WETAN', npsn: '20215380', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', url: 'https://sdn2cipeujeuhwetan.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 3 CIPEUJEUH WETAN', npsn: '20214479', jenjang: 'SD', desa: 'CIPEUJEUH WETAN', url: 'https://sdn3cipeujeuhwetan.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 LEMAHABANG', npsn: '20215162', jenjang: 'SD', desa: 'LEMAHABANG', url: 'https://sdn1lemahabang.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 2 LEMAHABANG', npsn: '20214656', jenjang: 'SD', desa: 'LEMAHABANG', url: 'https://sdn2lemahabang.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 LEMAHABANG KULON', npsn: '20215161', jenjang: 'SD', desa: 'LEMAHABANG KULON', url: 'https://sdn1lemahabangkulon.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 LEUWIDINGDING', npsn: '20215164', jenjang: 'SD', desa: 'LEUWIDINGDING', url: 'https://sdn1leuwidingding.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 PICUNGPUGUR', npsn: '20246442', jenjang: 'SD', desa: 'PICUNGPUGUR', url: 'https://sdn1picungpugur.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 SARAJAYA', npsn: '20215517', jenjang: 'SD', desa: 'SARAJAYA', url: 'https://sdn1sarajaya.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 2 SARAJAYA', npsn: '20214726', jenjang: 'SD', desa: 'SARAJAYA', url: 'https://sdn2sarajaya.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 SIGONG', npsn: '20215506', jenjang: 'SD', desa: 'SIGONG', url: 'https://sdn1sigong.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 3 SIGONG', npsn: '20214570', jenjang: 'SD', desa: 'SIGONG', url: 'https://sdn3sigong.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 4 SIGONG', npsn: '20244513', jenjang: 'SD', desa: 'SIGONG', url: 'https://sdn4sigong.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 SINDANGLAUT', npsn: '20215464', jenjang: 'SD', desa: 'SINDANGLAUT', url: 'https://sdn1sindanglaut.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 TUK KARANGSUWUNG', npsn: '20246445', jenjang: 'SD', desa: 'TUK KARANGSUWUNG', url: 'https://sdn1tukkarangsuwung.sch.id', status: 'aktif' },
  { nama: 'SD NEGERI 1 WANGKELANG', npsn: '20215584', jenjang: 'SD', desa: 'WANGKELANG', url: 'https://sdn1wangkelang.sch.id', status: 'aktif' },
  { nama: 'SD IT AL IRSYAD AL ISLAMIYYAH', npsn: '20215221', jenjang: 'SD', desa: 'LEMAHABANG KULON', url: 'https://sditalirsyad.sch.id', status: 'aktif' },
];

const aktifCount = sekolahWebsites.filter(s => s.status === 'aktif').length;
const tidakAktifCount = sekolahWebsites.filter(s => s.status === 'tidak_aktif').length;

export default function WebsiteSekolahPage() {
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('semua');

  const filtered = useMemo(() => {
    return sekolahWebsites.filter(s => {
      const matchSearch = !search || s.nama.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search) || s.desa.toLowerCase().includes(search.toLowerCase());
      const matchJenjang = filterJenjang === 'semua' || s.jenjang === filterJenjang;
      return matchSearch && matchJenjang;
    });
  }, [search, filterJenjang]);

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
              <Globe className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Website Sekolah</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Website Sekolah</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{sekolahWebsites.length}</p>
                <p className="text-xs text-gray-500">Total Website</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{aktifCount}</p>
                <p className="text-xs text-gray-500">Aktif</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <School className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{tidakAktifCount}</p>
                <p className="text-xs text-gray-500">Tidak Aktif</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b gap-3">
            <h3 className="font-semibold text-[#0d3b66]">Daftar Website Sekolah</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full sm:w-56"
                />
              </div>
              <select
                value={filterJenjang}
                onChange={e => setFilterJenjang(e.target.value)}
                className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="semua">Semua Jenjang</option>
                <option value="SD">SD</option>
                <option value="TK">TK</option>
                <option value="PAUD">PAUD</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Nama Sekolah</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">NPSN</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Jenjang</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Desa</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Website</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s, i) => (
                  <tr key={s.npsn} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-[#0d3b66] whitespace-nowrap">{s.nama}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{s.npsn}</td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-100 text-blue-700">
                        {s.jenjang}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {s.desa}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${s.status === 'aktif' ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
                      >
                        {s.url.replace('https://', '')}
                        {s.status === 'aktif' && <ExternalLink className="w-3 h-3 shrink-0" />}
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${s.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                      Tidak ada data yang sesuai
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0d3b66] mb-2">Informasi Website Sekolah</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Halaman ini menampilkan daftar website resmi satuan pendidikan di Kecamatan Lemahabang,
            Kabupaten Cirebon. Untuk mengakses website sekolah, klik tautan yang tersedia.
            Bagi sekolah yang website-nya belum aktif, silakan menghubungi operator sekolah
            atau Dinas Pendidikan Kabupaten Cirebon untuk informasi lebih lanjut.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
