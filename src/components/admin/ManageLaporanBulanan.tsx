'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { AdminEmptyState } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { BarChart3, Search, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { allSekolah } from '@/data/sekolah';

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type StatusLaporan = 'belum_lapor' | 'draft' | 'sudah_lapor' | 'diverifikasi' | 'revisi';

const statusConfig: Record<StatusLaporan, { label: string; className: string }> = {
  belum_lapor: { label: 'Belum Lapor', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  sudah_lapor: { label: 'Sudah Lapor', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  diverifikasi: { label: 'Diverifikasi', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  revisi: { label: 'Revisi', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const months = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' }, { value: '05', label: 'Mei' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Ags' }, { value: '09', label: 'Sep' },
  { value: '10', label: 'Okt' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Des' },
];

interface LaporanRecord {
  id: string;
  sekolahId: string;
  sekolah: string;
  jenjang: string;
  bulan: string;
  tahun: number;
  status: StatusLaporan;
  tglLapor?: number;
}

export function ManageLaporanBulanan() {
  const { user } = useAppStore();
  const [data, setData] = useState<LaporanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [tahun] = useState(new Date().getFullYear());

  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'laporan_bulanan'), orderBy('tglLapor', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: LaporanRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as LaporanRecord));
      setData(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let items = isOperator && userSchool
      ? allSekolah.filter(s => s.nama.toLowerCase().includes(userSchool.toLowerCase()))
      : allSekolah;

    if (filterJenjang !== 'ALL') {
      items = items.filter(s => s.jenjang === filterJenjang);
    }
    if (search) {
      items = items.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()));
    }
    return items;
  }, [search, filterJenjang, isOperator, userSchool]);

  const allSekolahCount = allSekolah.length;
  const sudahLaporCount = data.filter(d => d.status === 'sudah_lapor' || d.status === 'diverifikasi').length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{allSekolahCount}</p>
          <p className="text-xs text-muted-foreground">Total Sekolah</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <p className="text-2xl font-bold text-green-600">{sudahLaporCount}</p>
          <p className="text-xs text-muted-foreground">Sudah Lapor</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <p className="text-2xl font-bold text-red-600">{allSekolahCount - sudahLaporCount}</p>
          <p className="text-xs text-muted-foreground">Belum Lapor</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'SD', 'TK', 'KB'].map((j) => (
          <button
            key={j}
            onClick={() => setFilterJenjang(j)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterJenjang === j
                ? 'bg-blue-800 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {j === 'ALL' ? 'Semua' : j}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari sekolah..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={filterBulan}
          onChange={e => setFilterBulan(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-background text-foreground"
        >
          <option value="">Semua Bulan</option>
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <AdminEmptyState icon={BarChart3} title="Tidak ada data" description="Tidak ada laporan ditemukan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sekolah</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Jenjang</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s, i) => {
                  const laporanSekolah = data.filter(d => d.sekolahId === s.npsn);
                  const latestStatus: StatusLaporan = laporanSekolah.length > 0 ? laporanSekolah[0].status : 'belum_lapor';
                  const sc = statusConfig[latestStatus];
                  return (
                    <tr key={s.npsn} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{s.nama}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-[10px]">{s.jenjang}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full ${sc.className}`}>
                          {latestStatus === 'diverifikasi' && <CheckCircle className="w-3 h-3" />}
                          {latestStatus === 'sudah_lapor' && <Clock className="w-3 h-3" />}
                          {latestStatus === 'belum_lapor' && <XCircle className="w-3 h-3" />}
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t text-xs text-muted-foreground">
          Menampilkan {filtered.length} sekolah
        </div>
      </div>
    </div>
  );
}
