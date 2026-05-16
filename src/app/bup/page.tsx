'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Clock, Search, Loader2, ChevronLeft, ChevronRight, Users, BadgeCheck, UserCheck, Calendar } from 'lucide-react';
import Footer from '@/components/portal/Footer';

interface Pegawai {
  nik: string;
  nama: string;
  jk: string;
  nuptk: string;
  tanggal_lahir: string;
  nip: string;
  status_kepegawaian: string;
  jenis_ptk: string;
  tugas_tambahan: string;
  sertifikasi: string;
  sekolah: string;
  role: string;
}

interface PageData {
  items: Pegawai[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const BUP_AGE = 60;

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  return new Date(+parts[0], +parts[1] - 1, +parts[2]);
}

function formatDateLocale(iso: string): string {
  const d = parseDate(iso);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function calculateAge(iso: string): { tahun: number; bulan: number } | null {
  const birth = parseDate(iso);
  if (!birth) return null;
  const now = new Date();
  let tahun = now.getFullYear() - birth.getFullYear();
  let bulan = now.getMonth() - birth.getMonth();
  if (bulan < 0) { tahun--; bulan += 12; }
  return { tahun, bulan };
}

function getBupDate(iso: string): Date | null {
  const birth = parseDate(iso);
  if (!birth) return null;
  const month = birth.getMonth() + 1;
  const year = birth.getFullYear() + BUP_AGE;
  return new Date(year, month, 1);
}

function formatBupDate(iso: string): string {
  const d = getBupDate(iso);
  return d ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d) : '-';
}

function getSisa(iso: string): string {
  const bup = getBupDate(iso);
  if (!bup) return '-';
  const now = new Date();
  if (bup <= now) return 'Pensiun';
  let tahun = bup.getFullYear() - now.getFullYear();
  let bulan = bup.getMonth() - now.getMonth();
  if (bulan < 0) { tahun--; bulan += 12; }
  if (tahun < 0) return 'Pensiun';
  if (tahun === 0 && bulan === 0) return '0 bulan';
  const parts: string[] = [];
  if (tahun > 0) parts.push(`${tahun} thn`);
  if (bulan > 0) parts.push(`${bulan} bln`);
  return parts.join(' ') || '< 1 bln';
}

function isPns(status: string): boolean {
  return status === 'PNS' || status === 'PPPK';
}

function getStatusBup(iso: string, status: string): 'hijau' | 'kuning' | 'merah' | 'none' {
  if (!isPns(status)) return 'none';
  const bup = getBupDate(iso);
  if (!bup) return 'none';
  const now = new Date();
  if (bup <= now) return 'merah';
  const diffMs = bup.getTime() - now.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  if (diffYears <= 2) return 'merah';
  if (diffYears <= 5) return 'kuning';
  return 'hijau';
}

export default function BupPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '100' });
        if (search.trim()) params.set('search', search.trim());
        const r = await fetch(`/api/pegawai/all?${params}`);
        const j = await r.json();
        setData(j);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, search]);

  const summary = useMemo(() => {
    if (!data) return { total: 0, pns: 0, pppk: 0, honor: 0, guru: 0 };
    const items = data.items;
    return {
      total: data.total,
      pns: items.filter((p) => p.status_kepegawaian === 'PNS').length,
      pppk: items.filter((p) => p.status_kepegawaian === 'PPPK').length,
      honor: items.filter((p) => p.status_kepegawaian.includes('Honor')).length,
      guru: items.filter((p) => p.jenis_ptk === 'Guru').length,
    };
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Batas Usia Pensiun</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Batas Usia Pensiun (BUP)</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{data ? data.total : '-'}</p>
                <p className="text-xs text-gray-500">Total Pegawai</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{data ? summary.pns : '-'}</p>
                <p className="text-xs text-gray-500">PNS</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{data ? summary.pppk : '-'}</p>
                <p className="text-xs text-gray-500">PPPK</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{data ? summary.honor : '-'}</p>
                <p className="text-xs text-gray-500">Honor</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b">
            <h3 className="font-semibold text-[#0d3b66]">Daftar Pegawai</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari NIK, Nama, NIP, atau Sekolah..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : !data || data.items.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">Data tidak ditemukan</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-3 font-semibold text-gray-600 w-10">No</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">NIK</th>
                      <th className="px-3 py-3 font-semibold text-gray-600">Nama</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">Tgl. Lahir</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Usia</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 hidden sm:table-cell">Status</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 hidden md:table-cell max-w-[180px]">Sekolah</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">BUP</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Sisa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.items.map((p, i) => {
                      const usia = calculateAge(p.tanggal_lahir);
                      const isPnsFlag = isPns(p.status_kepegawaian);
                      const statusBup = getStatusBup(p.tanggal_lahir, p.status_kepegawaian);
                      return (
                        <tr key={p.nik} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-3 py-3 text-gray-500">{i + 1 + (page - 1) * data.limit}</td>
                          <td className="px-3 py-3 font-mono text-xs text-gray-500">{p.nik}</td>
                          <td className="px-3 py-3 font-medium text-[#0d3b66] whitespace-nowrap">{p.nama}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap hidden sm:table-cell">{formatDateLocale(p.tanggal_lahir)}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {usia ? (
                              <span className={`font-medium ${usia.tahun >= BUP_AGE ? 'text-red-600' : usia.tahun >= BUP_AGE - 2 ? 'text-orange-600' : 'text-gray-700'}`}>
                                {usia.tahun} thn
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${
                              p.status_kepegawaian === 'PNS' ? 'bg-green-100 text-green-700' :
                              p.status_kepegawaian === 'PPPK' ? 'bg-teal-100 text-teal-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {p.status_kepegawaian}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs hidden md:table-cell max-w-[180px] truncate">{p.sekolah}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap hidden md:table-cell">
                            {isPnsFlag ? formatBupDate(p.tanggal_lahir) : '-'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {isPnsFlag ? (
                              <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${
                                statusBup === 'merah' ? 'bg-red-100 text-red-700' :
                                statusBup === 'kuning' ? 'bg-yellow-100 text-yellow-700' :
                                statusBup === 'hijau' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {getSisa(p.tanggal_lahir)}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50/50">
                <p className="text-xs text-gray-500">
                  Menampilkan {(page - 1) * data.limit + 1}-{Math.min(page * data.limit, data.total)} dari {data.total}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {data.totalPages > 1 && Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                    let p: number;
                    if (data.totalPages <= 5) {
                      p = i + 1;
                    } else if (page <= 3) {
                      p = i + 1;
                    } else if (page >= data.totalPages - 2) {
                      p = data.totalPages - 4 + i;
                    } else {
                      p = page - 2 + i;
                    }
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg ${page === p ? 'bg-blue-800 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(Math.min(data.totalPages, page + 1))} disabled={page >= data.totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0d3b66] mb-2">Informasi</h3>
          <div className="text-sm text-gray-600 leading-relaxed space-y-1">
            <p>Batas Usia Pensiun (BUP) untuk PNS dan PPPK ditetapkan pada usia 60 tahun. BUP jatuh pada <strong>tanggal 1 bulan berikutnya</strong> setelah mencapai usia 60 tahun, sesuai peraturan perundang-undangan yang berlaku.</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-300" /> &gt; 5 tahun lagi</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300" /> 2-5 tahun lagi</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300" /> &lt; 2 tahun / pensiun</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
