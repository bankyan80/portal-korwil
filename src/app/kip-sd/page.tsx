'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, WalletMinimal, Loader2, School } from 'lucide-react';
import Footer from '@/components/portal/Footer';

interface SekolahSummary {
  sekolah: string;
  total: number;
  l: number;
  p: number;
}

export default function KipSdPage() {
  const [data, setData] = useState<SekolahSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = collection(db, 'kip_sd');
    setLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let siswa: any[] = [];
        if (!snapshot.empty) {
          siswa = snapshot.docs.map(d => d.data());
        }

        if (siswa.length === 0) {
          fetch('/api/siswa/list?jenjang=SD&layak_pip=Ya')
            .then(r => r.json())
            .then(json => {
              siswa = json.siswa || [];
              processSiswa(siswa);
            })
            .catch(() => { setData([]); setLoading(false); });
          return;
        }

        processSiswa(siswa);
      },
      (err) => {
        console.error('Error in kip_sd realtime listener:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const processSiswa = (siswa: any[]) => {
    const map = new Map<string, { l: number; p: number }>();
    for (const s of siswa) {
      const sklh = s.sekolah || s.schoolName || '-';
      if (!map.has(sklh)) map.set(sklh, { l: 0, p: 0 });
      const d = map.get(sklh)!;
      if ((s.jk || s.jenisKelamin) === 'L') d.l++;
      else d.p++;
    }

    const result: SekolahSummary[] = [];
    for (const [sekolah, counts] of map) {
      result.push({ sekolah, total: counts.l + counts.p, ...counts });
    }
    setData(result.sort((a, b) => b.total - a.total || a.sekolah.localeCompare(b.sekolah)));
    setLoading(false);
  };

  const totalPenerima = data.reduce((a, s) => a + s.total, 0);
  const totalL = data.reduce((a, s) => a + s.l, 0);
  const totalP = data.reduce((a, s) => a + s.p, 0);

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

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Kartu Indonesia Pintar SD</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalPenerima}</p>
            <p className="text-xs text-gray-500">Total Penerima PIP</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalL}</p>
            <p className="text-xs text-gray-500">Laki-laki</p>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalP}</p>
            <p className="text-xs text-gray-500">Perempuan</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center gap-2">
              <School className="w-4 h-4 text-gray-500" />
              <p className="text-sm font-semibold text-[#0d3b66]">Progres Penerima PIP per Sekolah</p>
              <span className="ml-auto text-xs text-gray-500">{data.length} sekolah</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 font-semibold text-gray-600 w-12">No</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Sekolah</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 text-center">L</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 text-center">P</th>
                    <th className="px-5 py-3 font-semibold text-gray-600 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">Tidak ada data penerima PIP</td></tr>
                  ) : (
                    data.map((s, i) => (
                      <tr key={s.sekolah} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-5 py-3 font-medium text-[#0d3b66]">{s.sekolah}</td>
                        <td className="px-5 py-3 text-center text-blue-700 font-semibold">{s.l}</td>
                        <td className="px-5 py-3 text-center text-pink-700 font-semibold">{s.p}</td>
                        <td className="px-5 py-3 text-center text-[#0d3b66] font-bold">{s.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
