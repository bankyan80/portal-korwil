'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Search, Loader2, ChevronLeft, ChevronRight, Users, BadgeCheck, UserCheck, FileDown, Printer, Calendar } from 'lucide-react';
import { useSort } from '@/hooks/useSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import Footer from '@/components/portal/Footer';
import * as XLSX from 'xlsx';

interface Pegawai {
  nik?: string;
  nama: string;
  jk: string;
  nuptk: string;
  tanggal_lahir?: string;
  nip?: string;
  status_kepegawaian: string;
  jenis_ptk: string;
  tugas_tambahan: string;
  sertifikasi: string;
  sekolah: string;
  role: string;
  tmt?: string;
}

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const parts = iso.split('-');
  if (parts.length !== 3) return null;
  return new Date(+parts[0], +parts[1] - 1, +parts[2]);
}

function formatDateLocale(iso: string): string {
  if (!iso) return '-';
  const d = parseDate(iso);
  if (!d) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function countKgb(tmt: string): number {
  const start = parseDate(tmt);
  if (!start) return -1;
  const now = new Date();
  const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (diffMonths < 24) return 0;
  return Math.floor(diffMonths / 24);
}

function getKgbTerakhir(tmt: string): Date | null {
  const start = parseDate(tmt);
  if (!start) return null;
  const n = countKgb(tmt);
  if (n <= 0) return null;
  return addYears(start, n * 2);
}

function getKgbBerikutnya(tmt: string): Date | null {
  const start = parseDate(tmt);
  if (!start) return null;
  const n = countKgb(tmt);
  return addYears(start, (n + 1) * 2);
}

function formatKgbTerakhir(tmt: string): string {
  if (!tmt) return '-';
  const d = getKgbTerakhir(tmt);
  if (!d) return 'Belum ada KGB';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function formatKgbBerikutnya(tmt: string): { label: string; urgent: boolean } {
  if (!tmt) return { label: '-', urgent: false };
  const d = getKgbBerikutnya(tmt);
  if (!d) return { label: '-', urgent: false };
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  const label = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  return { label, urgent: diffMonths <= 3 };
}

function getKgbKe(tmt: string): string {
  if (!tmt) return '-';
  const n = countKgb(tmt);
  if (n <= 0) return 'Belum ada';
  return `Ke-${n}`;
}

const PER_PAGE = 50;

export default function KgbPage() {
  const [allData, setAllData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/pegawai/all?page=1&limit=1000');
        const j = await r.json();
        let items: Pegawai[] = (j.items || []).filter(
          (p: Pegawai) => p.status_kepegawaian === 'PNS' || p.status_kepegawaian === 'PPPK'
        );
        setAllData(items);
      } catch {
        setAllData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let items = [...allData];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) =>
        p.nama.toLowerCase().includes(q) ||
        (p.sekolah || '').toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      const aB = getKgbBerikutnya(a.tmt || '')?.getTime() ?? Infinity;
      const bB = getKgbBerikutnya(b.tmt || '')?.getTime() ?? Infinity;
      return aB - bB;
    });
    return items.map(p => ({ ...p, _kgbNext: getKgbBerikutnya(p.tmt || '')?.getTime() ?? Infinity }));
  }, [allData, search]);

  const { sorted, sortKey, sortDir, toggle } = useSort(filtered, null);

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const summary = useMemo(() => ({
    total: sorted.length,
    pns: sorted.filter((p) => p.status_kepegawaian === 'PNS').length,
    pppk: sorted.filter((p) => p.status_kepegawaian === 'PPPK').length,
    urgent: sorted.filter((p) => {
      const r = getKgbBerikutnya(p.tmt || '');
      return r.urgent;
    }).length,
  }), [sorted]);

  const exportExcel = useCallback(() => {
    const rows = sorted.map((p, i) => ({
      No: i + 1,
      Nama: p.nama,
      Status: p.status_kepegawaian,
      NUPTK: p.nuptk || '-',
      NIP: p.nip || '-',
      Sekolah: p.sekolah,
      TMT: formatDateLocale(p.tmt || ''),
      'KGB Ke-': getKgbKe(p.tmt || ''),
      'KGB Terakhir': formatKgbTerakhir(p.tmt || ''),
      'KGB Berikutnya': formatKgbBerikutnya(p.tmt || '').label,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 4 }, { wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 22 },
      { wch: 35 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KGB');
    XLSX.writeFile(wb, `Data_KGB_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [sorted]);

  const exportPdf = useCallback(() => {
    window.print();
  }, []);

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
              <Calendar className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Data KGB</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0d3b66]">Kenaikan Gaji Berkala (KGB)</h2>
            <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors">
              <FileDown className="w-4 h-4" /> Unduh Excel
            </button>
            <button onClick={exportPdf} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors">
              <Printer className="w-4 h-4" /> Unduh PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : summary.total}</p>
                <p className="text-xs text-gray-500">Total ASN</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : summary.pns}</p>
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
                <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : summary.pppk}</p>
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
                <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : summary.urgent}</p>
                <p className="text-xs text-gray-500">KGB &le; 3 bln</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b">
            <h3 className="font-semibold text-[#0d3b66]">Daftar PNS / PPPK</h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari nama atau sekolah..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : sorted.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">Data tidak ditemukan</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" id="kgb-table">
                  <thead>
                    <tr className="bg-gray-50 text-left group">
                      <th className="px-3 py-3 font-semibold text-gray-600 w-10">No</th>
                      <SortableHeader label="Nama" sortKey="nama" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="px-3 py-3" />
                      <SortableHeader label="Status" sortKey="status_kepegawaian" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="px-3 py-3" hideBelow="sm" />
                      <SortableHeader label="Sekolah" sortKey="sekolah" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="px-3 py-3 max-w-[180px]" hideBelow="md" />
                      <SortableHeader label="TMT" sortKey="tmt" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="px-3 py-3 whitespace-nowrap" hideBelow="md" />
                      <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">KGB Ke-</th>
                      <th className="px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">KGB Terakhir</th>
                      <SortableHeader label="KGB Berikutnya" sortKey="_kgbNext" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="px-3 py-3 whitespace-nowrap" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginated.map((p, i) => {
                      const nextKgb = getKgbBerikutnya(p.tmt || '');
                      const nextInfo = formatKgbBerikutnya(p.tmt || '');
                      const item = { ...p, _kgbNext: nextKgb?.getTime() ?? Infinity };
                      return (
                        <tr key={p.nik || `${p.nama}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-3 py-3 text-gray-500">{(page - 1) * PER_PAGE + i + 1}</td>
                          <td className="px-3 py-3 font-medium text-[#0d3b66] whitespace-nowrap">{p.nama}</td>
                          <td className="px-3 py-3 hidden sm:table-cell">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${
                              p.status_kepegawaian === 'PNS' ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'
                            }`}>{p.status_kepegawaian}</span>
                          </td>
                          <td className="px-3 py-3 text-gray-500 text-xs hidden md:table-cell max-w-[180px] truncate">{p.sekolah}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap hidden md:table-cell">{formatDateLocale(p.tmt || '')}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{getKgbKe(p.tmt || '')}</td>
                          <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{formatKgbTerakhir(p.tmt || '')}</td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {nextInfo.urgent ? (
                              <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-red-100 text-red-700">
                                {nextInfo.label}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">{nextInfo.label}</span>
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
                  Menampilkan {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, sorted.length)} dari {sorted.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {totalPages > 1 && Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg ${page === p ? 'bg-blue-800 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>{p}</button>
                    );
                  })}
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
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
            <p>Kenaikan Gaji Berkala (KGB) diberikan setiap <strong>2 (dua) tahun</strong> sejak TMT (Tanggal Mulai Tugas).</p>
            <p>KGB berikutnya dihitung berdasarkan TMT + (n + 1) &times; 2 tahun, dengan n adalah jumlah KGB yang sudah pernah diberikan.</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-100 border border-red-300" /> KGB &le; 3 bulan lagi</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300" /> KGB &gt; 3 bulan lagi</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 15mm; }
          table { font-size: 10pt; width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
          th { background: #f0f0f0; font-weight: 600; }
        }
      `}</style>
    </div>
  );
}
