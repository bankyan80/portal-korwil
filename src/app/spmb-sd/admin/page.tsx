'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, FileText, Users, CheckCircle, Clock, XCircle, Search, Loader2, ThumbsUp, ThumbsDown, UserPlus } from 'lucide-react';
import { apiSet } from '@/lib/api-firestore';
import { toast } from 'sonner';
import Footer from '@/components/portal/Footer';

import { useFirestoreCollection } from '@/hooks/use-firestore-collection';

interface Pendaftar {
  id: string;
  nama: string;
  nik: string;
  jk?: string;
  jalur: string;
  usia: number;
  status: string;
  tglDaftar: string;
  sekolah: string;
  desa?: string;
  tanggal_lahir?: string;
  no_hp?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  daftarUlang?: boolean;
  tglDaftarUlang?: string;
}

const defaultData: Pendaftar[] = [];

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
  const daftarUlang = filtered.filter((d) => d.daftarUlang).length;

  async function updateStatus(item: Pendaftar, newStatus: string) {
    try {
      await apiSet('spmb_sd', item.id, { status: newStatus }, true);
      toast.success(`Status ${item.nama} diubah menjadi ${newStatus}`);
    } catch (e) {
      console.error('Error updating status:', e);
      toast.error('Gagal mengubah status');
    }
  }

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Pendaftar', value: totalPendaftar, icon: Users, color: 'blue' },
                { label: 'Diterima', value: diterima, icon: CheckCircle, color: 'green' },
                { label: 'Cadangan', value: cadangan, icon: Clock, color: 'orange' },
                { label: 'Ditolak', value: ditolak, icon: XCircle, color: 'red' },
                { label: 'Daftar Ulang', value: daftarUlang, icon: UserPlus, color: 'teal' },
              ].map((item) => (
                <div key={item.label} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{item.label}</p>
                      <p className="text-3xl font-bold mt-2 text-[#0d3b66] dark:text-white">{item.value}</p>
                    </div>
                      <item.icon className={`w-10 h-10 opacity-20 ${item.color === 'blue' ? 'text-blue-600' : item.color === 'green' ? 'text-green-600' : item.color === 'orange' ? 'text-orange-600' : item.color === 'red' ? 'text-red-600' : 'text-teal-600'}`} />
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
                      <th className="p-4 text-left text-white font-medium hidden lg:table-cell">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="p-10 text-center text-gray-400">Belum ada data pendaftar</td></tr>
                    ) : (
                      filtered.map((item) => (
                        <tr key={item.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-4 text-[#0d3b66] dark:text-white font-medium">{item.nama}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400 hidden sm:table-cell font-mono text-xs">{item.nik}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400">{item.jalur}</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400">{item.usia} Thn</td>
                          <td className="p-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">{item.sekolah}</td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[item.status] || 'text-gray-600 bg-gray-50'}`}>
                                {item.status}
                              </span>
                              {item.daftarUlang && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                                  Daftar Ulang {item.tglDaftarUlang && `(${item.tglDaftarUlang})`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateStatus(item, 'Diverifikasi')}
                                disabled={item.status === 'Diverifikasi'}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Terima"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(item, 'Cadangan')}
                                disabled={item.status === 'Cadangan'}
                                className="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Jadikan Cadangan"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(item, 'Ditolak')}
                                disabled={item.status === 'Ditolak'}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Tolak"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
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
