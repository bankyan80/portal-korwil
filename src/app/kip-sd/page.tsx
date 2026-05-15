'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ArrowLeft, WalletMinimal, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Footer from '@/components/portal/Footer';

const PER_PAGE = 50;

interface SiswaItem {
  nik: string;
  nama: string;
  jk: string;
  sekolah: string;
  desa: string;
}

export default function KipSdPage() {
  const [data, setData] = useState<SiswaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sekolahFilter, setSekolahFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        if (db) {
          const snap = await getDocs(collection(db, 'kip_sd'));
          if (!snap.empty) {
            const list: SiswaItem[] = snap.docs.map(d => {
              const s = d.data();
              return {
                nik: s.nik || s.nisn || '',
                nama: s.nama || '',
                jk: s.jk || s.jenisKelamin || 'L',
                sekolah: s.sekolah || s.schoolName || '',
                desa: s.desa || '',
              };
            });
            setData(list);
            setLoading(false);
            return;
          }
        }
      } catch {}
      try {
        const r = await fetch('/api/siswa/list?jenjang=SD&layak_pip=Ya');
        const json = await r.json();
        setData(json.siswa || []);
      } catch { setData([]); }
      setLoading(false);
    }
    load();
  }, []);

  const sekolahList = useMemo(() => [...new Set(data.map(s => s.sekolah))].sort(), [data]);
  const filtered = useMemo(() => {
    const f = sekolahFilter ? data.filter(s => s.sekolah === sekolahFilter) : data;
    return [...f].sort((a, b) => a.sekolah.localeCompare(b.sekolah) || a.nama.localeCompare(b.nama));
  }, [data, sekolahFilter]);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [sekolahFilter]);

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
              <WalletMinimal className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">KIP SD</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Kartu Indonesia Pintar SD</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm flex-1 min-w-[160px]">
            <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : filtered.length}</p>
            <p className="text-xs text-gray-500">Penerima PIP{sekolahFilter ? ` — ${sekolahFilter}` : ''}</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm flex-1 min-w-[160px]">
            <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : data.length}</p>
            <p className="text-xs text-gray-500">Total seluruh sekolah</p>
          </div>
          <div className="w-full sm:w-auto sm:ml-auto">
            <select
              value={sekolahFilter}
              onChange={e => setSekolahFilter(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-700"
            >
              <option value="">Semua Sekolah</option>
              {sekolahList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50">
              <p className="text-sm font-semibold text-[#0d3b66]">Rekap Daftar Penerima PIP</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 font-semibold text-gray-600 w-12">No</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">NIK</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">L/P</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Sekolah</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Desa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">Tidak ada penerima PIP</td></tr>
                  ) : (
                    paginated.map((s, i) => (
                      <tr key={s.nik + i} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-5 py-3 text-gray-500">{(page - 1) * PER_PAGE + i + 1}</td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{s.nik}</td>
                        <td className="px-5 py-3 font-medium text-[#0d3b66] whitespace-nowrap">{s.nama}</td>
                        <td className="px-5 py-3 text-gray-500">{s.jk}</td>
                        <td className="px-5 py-3 text-gray-500 max-w-[220px] truncate">{s.sekolah}</td>
                        <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{s.desa}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 text-sm">
                <span className="text-gray-500">
                  {filtered.length === 0 ? '0 data' : `Menampilkan ${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, filtered.length)} dari ${filtered.length}`}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs font-medium rounded-lg ${p === page ? 'bg-blue-800 text-white' : 'bg-white text-gray-700 border hover:bg-gray-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
