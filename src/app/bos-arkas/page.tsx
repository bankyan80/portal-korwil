'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft, WalletMinimal, School, Search, Download, CheckCircle2, XCircle,
  AlertTriangle, Building2, Users, Banknote, Filter, ChevronDown, Loader2
} from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { BosSchoolData, StatusValidasi } from '@/types';

const statusLabel: Record<StatusValidasi, string> = {
  valid: 'Valid',
  tidak_valid: 'Tidak Valid',
  verifikasi: 'Verifikasi',
};

const statusIcon: Record<StatusValidasi, typeof CheckCircle2> = {
  valid: CheckCircle2,
  tidak_valid: XCircle,
  verifikasi: AlertTriangle,
};

const statusColors: Record<StatusValidasi, string> = {
  valid: 'bg-green-100 text-green-700',
  tidak_valid: 'bg-red-100 text-red-700',
  verifikasi: 'bg-yellow-100 text-yellow-700',
};

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export default function BosArkasPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusValidasi | 'semua'>('semua');
  const [filterJenjang, setFilterJenjang] = useState<string>('semua');
  const [showFilters, setShowFilters] = useState(false);
  const [data, setData] = useState<BosSchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }

    const q = query(collection(db, 'bos_arkas'), orderBy('nama'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: BosSchoolData[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as BosSchoolData);
      });
      setData(list);
      setLoading(false);
    }, (err) => {
      console.error('Firestore error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const totalDana = useMemo(() => data.reduce((sum, s) => sum + s.alokasiDana, 0), [data]);
  const totalSiswa = useMemo(() => data.reduce((sum, s) => sum + s.jumlahSiswa, 0), [data]);
  const validCount = useMemo(() => data.filter(s => s.statusValidasi === 'valid').length, [data]);
  const invalidCount = useMemo(() => data.filter(s => s.statusValidasi === 'tidak_valid').length, [data]);
  const verificationCount = useMemo(() => data.filter(s => s.statusValidasi === 'verifikasi').length, [data]);

  const filtered = useMemo(() => {
    return data.filter(s => {
      const matchSearch = !search || s.nama.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search) || s.desa.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'semua' || s.statusValidasi === filterStatus;
      const matchJenjang = filterJenjang === 'semua' || s.jenjang === filterJenjang;
      return matchSearch && matchStatus && matchJenjang;
    });
  }, [search, filterStatus, filterJenjang, data]);

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
              <WalletMinimal className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">BOS / ARKAS</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Monitoring BOS Tahun 2026</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon - Tahun Anggaran 2026</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <School className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0d3b66]">{data.length}</p>
                    <p className="text-xs text-gray-500">Total Sekolah</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0d3b66]">{totalSiswa.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500">Total Siswa</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0d3b66]">{formatRupiah(totalDana)}</p>
                    <p className="text-xs text-gray-500">Total Alokasi Dana</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-orange-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0d3b66]">{validCount}</p>
                    <p className="text-xs text-gray-500">Tervalidasi</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold text-green-800">{validCount}</p>
                  <p className="text-xs text-green-700">Sekolah Valid</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-yellow-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold text-yellow-800">{verificationCount}</p>
                  <p className="text-xs text-yellow-700">Perlu Verifikasi</p>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold text-red-800">{invalidCount}</p>
                  <p className="text-xs text-red-700">Tidak Valid</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 border-b gap-3">
                <h3 className="font-semibold text-[#0d3b66]">Daftar Validasi BOS</h3>
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
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <Download className="w-4 h-4" />
                    Ekspor
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="px-5 py-3 bg-slate-50 border-b flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Status:</span>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value as StatusValidasi | 'semua')}
                      className="text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="semua">Semua</option>
                      <option value="valid">Valid</option>
                      <option value="verifikasi">Verifikasi</option>
                      <option value="tidak_valid">Tidak Valid</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Jenjang:</span>
                    <select
                      value={filterJenjang}
                      onChange={e => setFilterJenjang(e.target.value)}
                      className="text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      <option value="semua">Semua</option>
                      <option value="SD">SD</option>
                      <option value="TK">TK</option>
                      <option value="PAUD">PAUD</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-400 self-center ml-auto">
                    {filtered.length} dari {data.length} sekolah
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Nama Sekolah</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">NPSN</th>
                      <th className="px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Jenjang</th>
                      <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Siswa</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Alokasi Dana</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-5 py-3 font-semibold text-gray-600 hidden xl:table-cell">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((s, i) => {
                      const Icon = statusIcon[s.statusValidasi];
                      return (
                        <tr key={s.npsn} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                          <td className="px-5 py-3 font-medium text-[#0d3b66] whitespace-nowrap">{s.nama}</td>
                          <td className="px-5 py-3 text-gray-500 font-mono text-xs">{s.npsn}</td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' : s.jenjang === 'TK' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                              {s.jenjang}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{s.jumlahSiswa}</td>
                          <td className="px-5 py-3 text-gray-500 font-mono text-xs">{formatRupiah(s.alokasiDana)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${statusColors[s.statusValidasi]}`}>
                              <Icon className="w-3 h-3" />
                              {statusLabel[s.statusValidasi]}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-400 text-xs max-w-[200px] truncate hidden xl:table-cell">
                            {s.catatan || '-'}
                          </td>
                        </tr>
                      );
                    })}

                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-[#0d3b66] mb-2">Informasi BOS / ARKAS</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Halaman ini menampilkan data monitoring validasi dana Bantuan Operasional Sekolah (BOS)
                untuk satuan pendidikan di Kecamatan Lemahabang, Kabupaten Cirebon.
                Data bersumber dari sistem ARKAS (Aplikasi Kas Online) dan Dapodik.
                Untuk informasi lebih lanjut, silakan menghubungi tim keuangan kecamatan
                atau operator sekolah masing-masing.
              </p>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
