'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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

export default function YatimPiatuPage() {
  const [data, setData] = useState<YatimPiatuData[]>([]);
  const [loading, setLoading] = useState(db ? true : false);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'yatim_piatu'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: YatimPiatuData[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as YatimPiatuData));
      setData(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const counts = useMemo(() => ({
    yatim_piatu: data.filter(d => d.kategori === 'yatim_piatu').length,
    yatim: data.filter(d => d.kategori === 'yatim').length,
    piatu: data.filter(d => d.kategori === 'piatu').length,
  }), [data]);

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
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Data Yatim Piatu</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">NIK</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Sekolah</th>
                      <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Desa</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Kategori</th>
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
                      data.map((d, i) => (
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
    </div>
  );
}