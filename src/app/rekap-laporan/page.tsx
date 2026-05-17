'use client';

import {
  ArrowLeft, BarChart3, FileSpreadsheet, FileText, Printer,
  Search, School, Building2, GraduationCap, Users, BookOpen,
  CheckCircle, XCircle, Clock, AlertTriangle, Loader2, Info,
  ChevronDown, ChevronUp, Filter, Eye, Edit, Trash2, SortAsc,
} from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { normalizeSchool } from '@/lib/normalize';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { allSekolah as sharedSekolah } from '@/data/sekolah';

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type StatusLaporan = 'belum_lapor' | 'draft' | 'sudah_lapor' | 'diverifikasi' | 'revisi';

interface LaporanRecord {
  id: string;
  sekolah: string;
  bulan: string;
  tahun: number;
  status: StatusLaporan;
  tglLapor?: number;
}
type Jenjang = 'SD' | 'TK' | 'KB';
type StatusSekolah = 'NEGERI' | 'SWASTA';

interface Sekolah {
  id: string;
  nama: string;
  npsn: string;
  nss: string;
  jenjang: Jenjang;
  status: StatusSekolah;
  kecamatan: string;
  desa: string;
  alamat: string;
  kepalaSekolah: string;
  operator: string;
  noHp: string;
  email: string;
  akreditasi: string;
  tahunBerdiri: number;
  statusOperasional: string;
  namaYayasan?: string;
  ketuaYayasan?: string;
  nomorSKYayasan?: string;
  statusIzinOperasional?: string;
  masaBerlakuIzin?: string;
}

interface LaporanBulan {
  status: StatusLaporan;
  tglLapor?: number;
  catatan?: string;
}

interface LaporanTahunan {
  sekolahId: string;
  tahun: number;
  bulan: Record<string, LaporanBulan>;
  dataSiswa?: any;
  dataGtk?: any;
  dataSarpras?: any;
}

function getStatusBadge(status: StatusLaporan) {
  switch (status) {
    case 'sudah_lapor':
      return { label: 'Sudah Lapor', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', icon: CheckCircle };
    case 'diverifikasi':
      return { label: 'Diverifikasi', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', icon: CheckCircle };
    case 'draft':
      return { label: 'Draft', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400', icon: Clock };
    case 'revisi':
      return { label: 'Revisi', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400', icon: AlertTriangle };
    default:
      return { label: 'Belum Lapor', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', icon: XCircle };
  }
}

const statusIconMap: Record<StatusLaporan, string> = {
  sudah_lapor: '✔',
  draft: '⏳',
  belum_lapor: '❌',
  revisi: '🔄',
  diverifikasi: '✓',
};

export default function LaporanBulananPage() {
  const user = useAppStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStatusSekolah, setFilterStatusSekolah] = useState<string>('all');
  const [filterBulan, setFilterBulan] = useState<string>('all');
  const [tahun, setTahun] = useState('2026');
  const [sortField, setSortField] = useState<string>('nama');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [sekolahList, setSekolahList] = useState<Sekolah[]>([]);
  const [laporanList, setLaporanList] = useState<LaporanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const perPage = 10;

  // Realtime listener for schools
  useEffect(() => {
    let sekolahLoaded = false;
    let laporanLoaded = false;
    const finishLoading = () => {
      if (sekolahLoaded && laporanLoaded) {
        setLoading(false);
      }
    };

    if (db) {
      const sekolahUnsub = onSnapshot(
        collection(db, 'tabel_sekolah'),
        (snapshot) => {
          const sekolahData: Sekolah[] = [];
          snapshot.forEach((doc) => {
            sekolahData.push({ id: doc.id, ...doc.data() } as Sekolah);
          });
          if (sekolahData.length > 0) {
            setSekolahList(sekolahData);
          }
          sekolahLoaded = true;
          finishLoading();
        },
        (err) => {
          console.error('Error in tabel_sekolah listener:', err);
          sekolahLoaded = true;
          finishLoading();
        }
      );

      const laporanUnsub = onSnapshot(
        collection(db, 'laporan_bulanan'),
        (snapshot) => {
          const laporanData: LaporanRecord[] = [];
          snapshot.forEach((doc) => {
            const d = doc.data();
            laporanData.push({
              id: doc.id,
              sekolah: d.sekolah || d.dataSekolah?.nama || '',
              bulan: d.bulan,
              tahun: d.tahun,
              status: d.status || 'draft',
              tglLapor: d.tglLapor,
            });
          });
          setLaporanList(laporanData);
          laporanLoaded = true;
          finishLoading();
        },
        (err) => {
          console.error('Error in laporan_bulanan listener:', err);
          laporanLoaded = true;
          finishLoading();
        }
      );

      return () => {
        sekolahUnsub();
        laporanUnsub();
      };
    }
    if (!db) setLoading(false);
  }, []);

  const stats = useMemo(() => {
    const total = sekolahList.length;
    const totalSd = sekolahList.filter((s) => s.jenjang === 'SD').length;
    const totalTk = sekolahList.filter((s) => s.jenjang === 'TK').length;
    const totalKb = sekolahList.filter((s) => s.jenjang === 'KB').length;
    const totalNegeri = sekolahList.filter((s) => s.status === 'NEGERI').length;
    const totalSwasta = sekolahList.filter((s) => s.status === 'SWASTA').length;
    return { total, totalSd, totalTk, totalKb, totalNegeri, totalSwasta };
  }, [sekolahList]);

  const laporanLookup = useMemo(() => {
    const map: Record<string, Record<string, StatusLaporan>> = {};
    const tahunNum = parseInt(tahun, 10);
    for (const l of laporanList) {
      if (l.tahun !== tahunNum) continue;
      const key = normalizeSchool(l.sekolah);
      if (!map[key]) map[key] = {};
      map[key][l.bulan] = l.status;
    }
    return map;
  }, [laporanList, tahun]);

  function getBulanStatus(school: Sekolah, bulan: string): StatusLaporan {
    const key = normalizeSchool(school.nama);
    return laporanLookup[key]?.[bulan] || 'belum_lapor';
  }

  function getSchoolFinalStatus(school: Sekolah): StatusLaporan {
    const key = normalizeSchool(school.nama);
    const bulanData = laporanLookup[key];
    if (!bulanData) return 'belum_lapor';
    let hasLapor = false;
    for (const b of bulanList) {
      const st = bulanData[b];
      if (st === 'diverifikasi') return 'diverifikasi';
      if (st && st !== 'belum_lapor') hasLapor = true;
    }
    if (hasLapor) {
      for (const b of bulanList) {
        const st = bulanData[b];
        if (st === 'revisi') return 'revisi';
      }
      return 'sudah_lapor';
    }
    return 'belum_lapor';
  }

  function getCompletedCount(school: Sekolah): number {
    const key = normalizeSchool(school.nama);
    const bulanData = laporanLookup[key];
    if (!bulanData) return 0;
    let count = 0;
    for (const b of bulanList) {
      const st = bulanData[b];
      if (st && st !== 'belum_lapor') count++;
    }
    return count;
  }

  const filtered = useMemo(() => {
    let result = [...sekolahList];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.nama.toLowerCase().includes(q) || s.npsn.includes(q));
    }
    if (filterJenjang !== 'all') result = result.filter((s) => s.jenjang === filterJenjang);
    if (filterStatusSekolah !== 'all') result = result.filter((s) => s.status === filterStatusSekolah);
    if (filterStatus !== 'all') {
      result = result.filter((s) => getSchoolFinalStatus(s) === filterStatus);
    }
    if (filterBulan !== 'all') {
      result = result.filter((s) => getBulanStatus(s, filterBulan) !== 'belum_lapor');
    }
    return result;
  }, [search, filterJenjang, filterStatusSekolah, filterStatus, filterBulan, sekolahList, laporanLookup]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = a.nama.localeCompare(b.nama);
      if (sortField === 'jenjang') cmp = a.jenjang.localeCompare(b.jenjang);
      if (sortField === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const paginated = sorted.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);




  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }



  function handleExportExcel() {
    alert('Export Excel - akan diimplementasikan');
  }

  function handleExportPdf() {
    alert('Export PDF - akan diimplementasikan');
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Kembali</span>
              </a>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                <h1 className="text-sm font-bold text-white uppercase tracking-wide">Laporan Rutin Bulanan</h1>
              </div>
              <div />
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
            <p className="text-sm text-gray-500">Memuat data sekolah...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-50 print:hidden bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Laporan Rutin Bulanan</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 print:px-0">
        <div className="print:hidden">
          <h2 className="text-2xl font-bold text-[#0d3b66] dark:text-white">Laporan Rutin Bulanan</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitoring pendidikan Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        {user && user.role !== 'operator_sekolah' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3 print:hidden">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Akun Anda saat ini sebagai pengunjung. Silakan hubungi admin untuk diubah menjadi operator sekolah.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-6">
          <StatCard icon={School} label="Total Sekolah" value={stats.total} color="blue" />
          <StatCard icon={Building2} label="Negeri" value={stats.totalNegeri} color="green" />
          <StatCard icon={Building2} label="Swasta" value={stats.totalSwasta} color="orange" />
          <StatCard icon={BarChart3} label="SD" value={stats.totalSd} color="blue" />
          <StatCard icon={GraduationCap} label="TK" value={stats.totalTk} color="purple" />
          <StatCard icon={Users} label="KB" value={stats.totalKb} color="pink" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm overflow-hidden print:hidden">
          <button onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-semibold text-[#0d3b66] dark:text-white">Petunjuk Pengisian Laporan Bulanan</span>
            </div>
            {showGuide ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showGuide && (
            <div className="px-5 pb-4 border-t dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <h4 className="font-semibold text-[#0d3b66] dark:text-white">Langkah Pengisian</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Klik tombol <strong>Tambah Laporan</strong></li>
                    <li>Pilih sekolah dan periode laporan (bulan & tahun)</li>
                    <li>Isi data identitas sekolah (otomatis dari database)</li>
                    <li>Isi data peserta didik sesuai jenjang (SD/TK/KB)</li>
                    <li>Isi data GTK (guru dan tendik)</li>
                    <li>Isi data sarana prasarana dan infrastruktur digital</li>
                    <li>Upload dokumentasi jika diperlukan</li>
                    <li>Klik <strong>Simpan Laporan</strong></li>
                  </ol>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <h4 className="font-semibold text-[#0d3b66] dark:text-white">Ketentuan</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Hanya operator sekolah yang dapat mengisi laporan</li>
                    <li>Laporan diisi per bulan (Januari–Desember)</li>
                    <li>Data otomatis terisi dari database tetapi dapat diedit manual</li>
                    <li>Tidak boleh duplikat laporan pada bulan yang sama</li>
                    <li>Status laporan: Belum Lapor, Draft, Sudah Lapor, Revisi, Diverifikasi</li>
                    <li>Setelah disimpan, laporan masuk status <strong>Draft</strong></li>
                    <li>Admin kecamatan akan memverifikasi laporan</li>
                    <li>Jika ada revisi, akan muncul status <strong>Revisi</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter:</span>
          </div>
          <select value={tahun} onChange={(e) => setTahun(e.target.value)}
            className="text-sm border dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-white">
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
          </select>
          <select value={filterJenjang} onChange={(e) => setFilterJenjang(e.target.value)}
            className="text-sm border dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-white">
            <option value="all">Semua Jenjang</option>
            <option value="SD">SD</option>
            <option value="TK">TK</option>
            <option value="KB">KB</option>
          </select>
          <select value={filterStatusSekolah} onChange={(e) => setFilterStatusSekolah(e.target.value)}
            className="text-sm border dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-white">
            <option value="all">Negeri & Swasta</option>
            <option value="NEGERI">Negeri</option>
            <option value="SWASTA">Swasta</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-white">
            <option value="all">Semua Status</option>
            <option value="sudah_lapor">Sudah Lapor</option>
            <option value="draft">Draft</option>
            <option value="belum_lapor">Belum Lapor</option>
            <option value="revisi">Revisi</option>
            <option value="diverifikasi">Diverifikasi</option>
          </select>
          <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}
            className="text-sm border dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 dark:text-white">
            <option value="all">Semua Bulan</option>
            {bulanList.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-white w-48" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50 text-left sticky top-0">
                  <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 w-10">No</th>
                   <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('nama')}>
                      Nama Sekolah {sortField === 'nama' ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                    </th>
                    <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleSort('jenjang')}>
                      Jenjang {sortField === 'jenjang' ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                    </th>
                   <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleSort('status')}>
                     Status {sortField === 'status' ? (sortDir === 'asc' ? '\u25B2' : '\u25BC') : ''}
                   </th>
                  {bulanList.map((b) => (
                    <th key={b} className="px-2 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center text-[11px] min-w-[70px]">
                      {b.slice(0, 3)}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center">%</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center">Status</th>
                  <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={19} className="px-3 py-12 text-center text-gray-400 dark:text-gray-500">
                      Tidak ada data sekolah
                    </td>
                  </tr>
                )}
                {paginated.map((s, i) => {
                  const finalStatus = getSchoolFinalStatus(s);
                  const badge = getStatusBadge(finalStatus);
                  const BadgeIcon = badge.icon;
                  const completed = getCompletedCount(s);
                  const pct = Math.round((completed / 12) * 100);
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{(page - 1) * perPage + i + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-[#0d3b66] dark:text-white text-xs leading-tight">
                        <div>{s.nama}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{s.npsn}</div>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                          s.jenjang === 'TK' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' :
                          'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400'
                        }`}>{s.jenjang}</span>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          s.status === 'NEGERI' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                        }`}>{s.status}</span>
                      </td>
                      {bulanList.map((b) => {
                        const st = getBulanStatus(s, b);
                        const stIcon = st === 'diverifikasi' ? '✅' : st === 'sudah_lapor' ? '✔️' : st === 'draft' ? '⏳' : st === 'revisi' ? '🔄' : '❌';
                        const stColor = st === 'belum_lapor' ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400';
                        return (
                          <td key={b} className="px-2 py-2.5 text-center">
                            <span className={`text-xs ${stColor}`} title={st}>{stIcon}</span>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" /> {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Lihat">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Hapus">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Menampilkan {(page - 1) * perPage + 1}-{Math.min(page * perPage, sorted.length)} dari {sorted.length}
              </span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 text-sm border dark:border-slate-700 rounded-lg disabled:opacity-40 bg-white dark:bg-slate-800 dark:text-white">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 text-sm border dark:border-slate-700 rounded-lg ${
                      page === i + 1 ? 'bg-blue-700 text-white border-blue-700' : 'bg-white dark:bg-slate-800 dark:text-white'
                    }`}>{i + 1}</button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 text-sm border dark:border-slate-700 rounded-lg disabled:opacity-40 bg-white dark:bg-slate-800 dark:text-white">Next</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-[#0d3b66] dark:text-white truncate">{value}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
