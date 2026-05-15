'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, FileText, Users, CheckCircle, Clock, XCircle, Search, Loader2 } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';

interface Pendaftar {
  id: string;
  nama: string;
  nik: string;
  jalur: string;
  usia: number;
  status: string;
  tglDaftar: string;
  sekolah: string;
}

const defaultData: Pendaftar[] = [
  { id: 'spmb-1', nama: 'Ahmad Fauzan', nik: '3209071234567890', jalur: 'Domisili', usia: 7, status: 'Diverifikasi', tglDaftar: '2025-06-01', sekolah: 'SD NEGERI 1 LEMAHABANG' },
  { id: 'spmb-2', nama: 'Siti Nurhaliza', nik: '3209071234567891', jalur: 'Afirmasi', usia: 6, status: 'Menunggu Verifikasi', tglDaftar: '2025-06-02', sekolah: 'SD NEGERI 1 LEMAHABANG' },
  { id: 'spmb-3', nama: 'Rudi Hartono', nik: '3209071234567892', jalur: 'Mutasi', usia: 8, status: 'Valid', tglDaftar: '2025-06-03', sekolah: 'SD NEGERI 2 BELAWA' },
  { id: 'spmb-4', nama: 'Dewi Lestari', nik: '3209071234567893', jalur: 'Domisili', usia: 6, status: 'Ditolak', tglDaftar: '2025-06-04', sekolah: 'SD NEGERI 1 LEMAHABANG' },
];

const statusColor: Record<string, string> = {
  Diverifikasi: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
  'Menunggu Verifikasi': 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
  Valid: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
  Ditolak: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
  Cadangan: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
};

export default function AdminPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const { items: data, loading } = useFirestoreCollection<Pendaftar>('spmb_sd', defaultData);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'super_admin' && user.role !== 'operator_sekolah')) {
      router.push('/spmb-sd');
    }
  }, [user, router]);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((d) => d.nama.toLowerCase().includes(q) || d.nik.includes(q) || d.sekolah.toLowerCase().includes(q));
  }, [data, search]);

  const totalPendaftar = filtered.length;
  const diterima = filtered.filter((d) => d.status === 'Diverifikasi' || d.status === 'Valid').length;
  const cadangan = filtered.filter((d) => d.status === 'Cadangan').length;
  const ditolak = filtered.filter((d) => d.status === 'Ditolak').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/spmb-sd" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Admin SPMB</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Total Pendaftar', value: totalPendaftar, icon: Users, color: 'blue' },
                { label: 'Diterima', value: diterima, icon: CheckCircle, color: 'green' },
                { label: 'Cadangan', value: cadangan, icon: Clock, color: 'orange' },
                { label: 'Ditolak', value: ditolak, icon: XCircle, color: 'red' },
              ].map((item) => (
                <div key={item.label} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{item.label}</p>
                      <p className="text-3xl font-bold mt-2 text-[#0d3b66] dark:text-white">{item.value}</p>
                    </div>
                    <item.icon className={`w-10 h-10 opacity-20 ${item.color === 'blue' ? 'text-blue-600' : item.color === 'green' ? 'text-green-600' : item.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Cari nama/NIK/sekolah..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow border dark:border-slate-700 overflow-hidden">
              <div className="p-5 border-b dark:border-slate-700">
                <h3 className="font-semibold text-[#0d3b66] dark:text-white">Rekap Pendaftaran</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
                    <tr>
                      <th className="p-4 text-left text-white font-medium">Nama</th>
                      <th className="p-4 text-left text-white font-medium hidden sm:table-cell">NIK</th>
                      <th className="p-4 text-left text-white font-medium">Jalur</th>
                      <th className="p-4 text-left text-white font-medium">Usia</th>
                      <th className="p-4 text-left text-white font-medium">Sekolah</th>
                      <th className="p-4 text-left text-white font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="p-10 text-center text-gray-400">Belum ada data pendaftar</td></tr>
                    ) : (
                      filtered.map((item) => (
                        <tr key={item.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-4 text-[#0d3b66] dark:text-white font-medium">{item.nama}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400 hidden sm:table-cell font-mono text-xs">{item.nik}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400">{item.jalur}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400">{item.usia} Thn</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{item.sekolah}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[item.status] || 'text-gray-600 bg-gray-50'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t dark:border-slate-700 text-xs text-gray-500">
                Menampilkan {filtered.length} dari {data.length} pendaftar
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
