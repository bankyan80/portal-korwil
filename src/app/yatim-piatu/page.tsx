'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Heart, Loader2, FileDown, Printer } from 'lucide-react';
import { useSort } from '@/hooks/useSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import Footer from '@/components/portal/Footer';
import * as XLSX from 'xlsx';
import { apiGet } from '@/lib/api-firestore';
import type { YatimPiatuData, YatimCategory } from '@/types';

const kategoriLabel: Record<YatimCategory, string> = {
  yatim_piatu: 'Yatim Piatu',
  yatim: 'Yatim',
  piatu: 'Piatu',
};

const kategoriColors: Record<YatimCategory, string> = {
  yatim_piatu: 'bg-red-100 text-red-700',
  yatim: 'bg-blue-100 text-blue-700',
  piatu: 'bg-purple-100 text-purple-700',
};

const kategoriSimple: Record<YatimCategory, string> = {
  yatim_piatu: 'Yatim Piatu',
  yatim: 'Yatim',
  piatu: 'Piatu',
};

export default function YatimPiatuPage() {
  const [data, setData] = useState<YatimPiatuData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('yatim_piatu', { orderBy: { field: 'createdAt', dir: 'desc' } }).then((res) => {
      const list: YatimPiatuData[] = (res.items || []).map((d: any) => ({ id: d.id, ...d }));
      setData(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    yatim_piatu: data.filter(d => d.kategori === 'yatim_piatu').length,
    yatim: data.filter(d => d.kategori === 'yatim').length,
    piatu: data.filter(d => d.kategori === 'piatu').length,
  }), [data]);

  const { sorted, sortKey, sortDir, toggle } = useSort(data, 'nama');

  const exportExcel = useCallback(() => {
    const rows = data.map((d, i) => ({
      No: i + 1,
      NIK: d.nik,
      Nama: d.nama,
      Sekolah: d.sekolah,
      Desa: d.desa || '',
      Kategori: kategoriSimple[d.kategori],
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 4 }, { wch: 18 }, { wch: 30 }, { wch: 35 }, { wch: 20 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Yatim Piatu');
    XLSX.writeFile(wb, `Data_Yatim_Piatu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [data]);

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
              <Heart className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Yatim Piatu</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0d3b66]">Data Yatim Piatu</h2>
            <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Unduh Excel
            </button>
            <button
              onClick={exportPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Unduh PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-800">{counts.yatim_piatu}</p>
                <p className="text-xs text-red-700">Yatim Piatu</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-800">{counts.yatim}</p>
                <p className="text-xs text-blue-700">Yatim (Ayah Meninggal)</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-purple-800">{counts.piatu}</p>
                <p className="text-xs text-purple-700">Piatu (Ibu Meninggal)</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" id="yatim-piatu-table">
                  <thead>
                    <tr className="bg-gray-50 text-left group">
                      <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                      <SortableHeader label="NIK" sortKey="nik" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                      <SortableHeader label="Nama" sortKey="nama" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                      <SortableHeader label="Sekolah" sortKey="sekolah" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                      <SortableHeader label="Desa" sortKey="desa" currentKey={sortKey} direction={sortDir} onToggle={toggle} hideBelow="md" />
                      <SortableHeader label="Kategori" sortKey="kategori" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                          Belum ada data
                        </td>
                      </tr>
                    ) : (
                      sorted.map((d, i) => (
                        <tr key={d.id || d.nik} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">{d.nik}</td>
                          <td className="px-5 py-3 font-medium text-[#0d3b66] whitespace-nowrap">{d.nama}</td>
                          <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate">{d.sekolah}</td>
                          <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{d.desa}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${kategoriColors[d.kategori]}`}>
                              {kategoriLabel[d.kategori]}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-[#0d3b66] mb-2">Keterangan</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Yatim Piatu</strong>: Kedua orang tua (ayah dan ibu) meninggal dunia.</li>
                <li><strong>Yatim</strong>: Ayah yang meninggal dunia.</li>
                <li><strong>Piatu</strong>: Ibu yang meninggal dunia.</li>
                <li>Jika ada perubahan data, silakan hubungi operator sekolah masing-masing.</li>
              </ul>
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Print-only layout */}
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          body { background: white !important; }
          .print-only { display: block !important; }
          @page { margin: 15mm; }
          table { font-size: 10pt; width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; }
          th { background: #f0f0f0; font-weight: 600; }
        }
        .print-only { display: none; }
      `}</style>
      <div className="print-only p-8">
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Data Yatim Piatu</h1>
        <p style={{ fontSize: 11, color: '#555', marginBottom: 16 }}>Kecamatan Lemahabang, Kabupaten Cirebon — Per {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>NIK</th>
              <th>Nama</th>
              <th>Sekolah</th>
              <th>Desa</th>
              <th>Kategori</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.id || d.nik}>
                <td>{i + 1}</td>
                <td>{d.nik}</td>
                <td>{d.nama}</td>
                <td>{d.sekolah}</td>
                <td>{d.desa || '-'}</td>
                <td>{kategoriSimple[d.kategori]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}