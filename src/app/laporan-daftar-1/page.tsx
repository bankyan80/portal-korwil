'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Users, BookOpen, ExternalLink,
  Loader2, BarChart3, School, ChevronDown, Table,
  ArrowLeft, Printer, RefreshCw,
} from 'lucide-react';
import { allSekolah } from '@/data/sekolah';

interface JenjangData {
  pegawai: { total: number; l: number; p: number; guru: number; tendik: number };
  siswa: { total: number; l: number; p: number };
}

interface BulanData {
  nama: string;
  index: number;
  calIndex: number;
  tahun: number;
  status: 'sudah' | 'belum';
  sd: JenjangData;
  tkKb: JenjangData;
}

interface RekapData {
  success: boolean;
  tahunAjaran: string;
  totalSekolah: number;
  totalPegawai: number;
  totalSiswa: number;
  sd: { pegawai: number; siswa: number };
  tkKb: { pegawai: number; siswa: number };
  bulan: BulanData[];
  sekolah: string[];
}

interface SiswaPerKelas {
  kelas: string;
  l: number;
  p: number;
  total: number;
}

interface MasaKerja {
  '<5': number;
  '5-10': number;
  '10-20': number;
  '>20': number;
}

interface PegawaiPerASN {
  jenis: string;
  l: number;
  p: number;
  total: number;
  masaKerja: MasaKerja;
}

interface DetailSekolah {
  nama: string;
  npsn: string;
  jenjang: string;
  siswa: SiswaPerKelas[];
  totalSiswa: number;
  totalSiswaL: number;
  totalSiswaP: number;
  pegawai: PegawaiPerASN[];
  totalPegawai: number;
  totalPegawaiL: number;
  totalPegawaiP: number;
}

interface PegawaiFlat {
  sekolah: string;
  jk: string;
  status_kepegawaian: string;
  tmt: string;
}

interface SiswaFlat {
  sekolah: string;
  jk: string;
  jenjang: string;
  kelas: string;
  rombel: string;
}

async function fetchPegawai(): Promise<PegawaiFlat[]> {
  const res = await fetch('/api/proxy/simpeg?limit=300');
  const json = await res.json();
  const data: any[] = json.data || [];
  return data.map((p) => ({
    sekolah: p.sekolah?.namaSekolah || '',
    jk: p.jenisKelamin,
    status_kepegawaian: p.statusKepegawaian,
    tmt: p.tmtTugas ? new Date(p.tmtTugas).toISOString() : '',
  }));
}

async function fetchSiswa(): Promise<SiswaFlat[]> {
  const all: SiswaFlat[] = [];
  let page = 1;
  const limit = 1000;
  while (true) {
    const res = await fetch(`/api/proxy/simdawa?page=${page}&limit=${limit}`);
    const json = await res.json();
    const data: any[] = json.siswa || [];
    if (data.length === 0) break;
    for (const s of data) {
      if (s.statusSiswa !== 'Aktif') continue;
      all.push({
        sekolah: s.sekolah?.namaSekolah || '',
        jk: s.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
        jenjang: s.jenjang,
        kelas: s.kelasKelompok || '',
        rombel: s.rombel || s.kelasKelompok || '',
      });
    }
    if (data.length < limit) break;
    page++;
  }
  return all;
}

function hitungMasaKerja(tmt: string): keyof MasaKerja {
  if (!tmt) return '>20';
  const tmtDate = new Date(tmt);
  if (isNaN(tmtDate.getTime())) return '>20';
  const years = (Date.now() - tmtDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (years < 5) return '<5';
  if (years < 10) return '5-10';
  if (years < 20) return '10-20';
  return '>20';
}

function groupBySekolah(pegawaiList: PegawaiFlat[], siswaList: SiswaFlat[]): DetailSekolah[] {
  const sekolahMap = new Map<string, DetailSekolah>();

  for (const s of allSekolah) {
    sekolahMap.set(s.nama, {
      nama: s.nama,
      npsn: s.npsn,
      jenjang: s.jenjang,
      siswa: [],
      totalSiswa: 0, totalSiswaL: 0, totalSiswaP: 0,
      pegawai: [],
      totalPegawai: 0, totalPegawaiL: 0, totalPegawaiP: 0,
    });
  }

  for (const p of pegawaiList) {
    let entry = sekolahMap.get(p.sekolah);
    if (!entry) {
      entry = {
        nama: p.sekolah, npsn: '', jenjang: '',
        siswa: [], totalSiswa: 0, totalSiswaL: 0, totalSiswaP: 0,
        pegawai: [], totalPegawai: 0, totalPegawaiL: 0, totalPegawaiP: 0,
      };
      sekolahMap.set(p.sekolah, entry);
    }
    entry.totalPegawai++;
    if (p.jk === 'L') entry.totalPegawaiL++;
    else entry.totalPegawaiP++;

    let asn = entry.pegawai.find((a) => a.jenis === p.status_kepegawaian);
    if (!asn) {
      asn = { jenis: p.status_kepegawaian, l: 0, p: 0, total: 0, masaKerja: { '<5': 0, '5-10': 0, '10-20': 0, '>20': 0 } };
      entry.pegawai.push(asn);
    }
    asn.total++;
    if (p.jk === 'L') asn.l++;
    else asn.p++;
    const mk = hitungMasaKerja(p.tmt);
    asn.masaKerja[mk]++;
  }

  for (const s of siswaList) {
    let entry = sekolahMap.get(s.sekolah);
    if (!entry) {
      entry = {
        nama: s.sekolah, npsn: '', jenjang: s.jenjang || '',
        siswa: [], totalSiswa: 0, totalSiswaL: 0, totalSiswaP: 0,
        pegawai: [], totalPegawai: 0, totalPegawaiL: 0, totalPegawaiP: 0,
      };
      sekolahMap.set(s.sekolah, entry);
    }
    entry.totalSiswa++;
    if (s.jk === 'L') entry.totalSiswaL++;
    else entry.totalSiswaP++;

    const labelKelas = s.kelas;
    let kelasEntry = entry.siswa.find((k) => k.kelas === labelKelas);
    if (!kelasEntry) {
      kelasEntry = { kelas: labelKelas, l: 0, p: 0, total: 0 };
      entry.siswa.push(kelasEntry);
    }
    kelasEntry.total++;
    if (s.jk === 'L') kelasEntry.l++;
    else kelasEntry.p++;
  }

  const entries = Array.from(sekolahMap.values());
  for (const entry of entries) {
    entry.siswa.sort((a, b) => a.kelas.localeCompare(b.kelas, undefined, { numeric: true }));
  }
  return entries.filter((e) => e.totalPegawai > 0 || e.totalSiswa > 0);
}

function getCurrentTa(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  if (m >= 7) return `${y}/${y + 1}`;
  return `${y - 1}/${y}`;
}

function taOptions(): string[] {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const currentStart = m >= 7 ? y : y - 1;
  return [
    `${currentStart - 1}/${currentStart}`,
    `${currentStart}/${currentStart + 1}`,
    `${currentStart + 1}/${currentStart + 2}`,
  ];
}

export default function LaporanDaftar1Page() {
  const [data, setData] = useState<RekapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tahunAjaran, setTahunAjaran] = useState(getCurrentTa());
  const [detailMonth, setDetailMonth] = useState<number | null>(null);
  const [detailJenjang, setDetailJenjang] = useState<'sd' | 'tkKb'>('sd');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [pegawaiList, setPegawaiList] = useState<PegawaiFlat[]>([]);
  const [siswaList, setSiswaList] = useState<SiswaFlat[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [p, s] = await Promise.all([fetchPegawai(), fetchSiswa()]);
      setPegawaiList(p);
      setSiswaList(s);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const detailSekolah = useMemo(() => {
    const all = groupBySekolah(pegawaiList, siswaList);
    const filtered = schoolFilter
      ? all.filter((s) => s.nama.toLowerCase().includes(schoolFilter.toLowerCase()))
      : all;
    return filtered.sort((a, b) => a.nama.localeCompare(b.nama));
  }, [pegawaiList, siswaList, schoolFilter]);

  const selectedDetail = useMemo(() => {
    return detailSekolah.find((s) => s.nama === selectedSchool) || null;
  }, [selectedSchool, detailSekolah]);

  useEffect(() => {
    setLoading(true);
    setDetailMonth(null);
    fetch(`/api/laporan-bulanan/rekap?tahunAjaran=${encodeURIComponent(tahunAjaran)}`)
      .then((r) => r.json())
      .then((d) => { setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tahunAjaran]);

  useEffect(() => {
    setApiLoading(true);
    Promise.all([fetchPegawai(), fetchSiswa()])
      .then(([p, s]) => {
        setPegawaiList(p);
        setSiswaList(s);
      })
      .catch(console.error)
      .finally(() => setApiLoading(false));
  }, []);

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600">Gagal memuat data.</p>
      </div>
    );
  }

  const selected = detailMonth ? data.bulan.find((b) => b.index === detailMonth) : null;
  const selJenjang = selected ? (detailJenjang === 'sd' ? selected.sd : selected.tkKb) : null;

  const totalSudah = data.bulan.filter((b) => b.status === 'sudah').length;
  const totalBelum = data.bulan.filter((b) => b.status === 'belum').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-slate-800 mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Kembali</span>
            </a>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-700" />
              DAFTAR 1
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data pegawai dan peserta didik per jenjang Kecamatan Lemahabang, Kabupaten Cirebon
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-sm border rounded-lg px-3 py-2 bg-white shadow-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Refresh data SIMPEG & SIMDAWA"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <select
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 bg-white shadow-sm font-medium"
            >
              {taOptions().map((ta) => (
                <option key={ta} value={ta}>T.A. {ta}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <School className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.totalSekolah}</p>
                <p className="text-xs text-muted-foreground">Sekolah</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.totalPegawai}</p>
                <p className="text-xs text-muted-foreground">Total Pegawai</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{data.totalSiswa}</p>
                <p className="text-xs text-muted-foreground">Total Siswa</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Table className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalSudah}</p>
                <p className="text-xs text-muted-foreground">Sudah Lapor ({totalBelum} belum)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabel Laporan */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-slate-50 flex items-center gap-2">
            <Table className="w-5 h-5 text-blue-700" />
            <h2 className="font-semibold text-slate-800">
              Rekap Data – Tahun Ajaran {data.tahunAjaran}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600 w-10">No</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Bulan</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center border-l" colSpan={2}>
                    SD
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center border-l" colSpan={2}>
                    TK/KB
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center border-l" colSpan={2}>
                    Total
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center border-l">Status</th>
                </tr>
                <tr className="bg-slate-50 text-xs text-muted-foreground">
                  <th colSpan={2}></th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                  <th className="px-3 py-2 text-center border-l font-medium">Pegawai</th>
                  <th className="px-3 py-2 text-center font-medium">Siswa</th>
                  <th className="px-3 py-2 text-center border-l"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.bulan.map((b, i) => {
                  const isDetail = detailMonth === b.index;
                  const isBelum = b.status === 'belum';
                  return (
                    <tr key={b.index} className={`${isBelum ? 'bg-gray-50 text-gray-400' : ''} ${isDetail ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        {isBelum ? (
                          <span className="text-gray-400">{b.nama}</span>
                        ) : (
                          <button
                            onClick={() => setDetailMonth(isDetail ? null : b.index)}
                            className="font-medium text-slate-800 hover:text-blue-700 transition-colors"
                          >
                            {b.nama}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center border-l font-semibold">{b.sd.pegawai.total}</td>
                      <td className="px-4 py-3 text-center font-semibold">{b.sd.siswa.total}</td>
                      <td className="px-4 py-3 text-center border-l font-semibold">{b.tkKb.pegawai.total}</td>
                      <td className="px-4 py-3 text-center font-semibold">{b.tkKb.siswa.total}</td>
                      <td className="px-4 py-3 text-center border-l font-bold">{b.sd.pegawai.total + b.tkKb.pegawai.total}</td>
                      <td className="px-4 py-3 text-center font-bold">{b.sd.siswa.total + b.tkKb.siswa.total}</td>
                      <td className="px-4 py-3 text-center border-l">
                        {isBelum ? (
                          <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                            Belum Lapor
                          </span>
                        ) : (
                          <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Sudah
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <td colSpan={2} className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-center border-l">{data.sd.pegawai}</td>
                  <td className="px-4 py-3 text-center">{data.sd.siswa}</td>
                  <td className="px-4 py-3 text-center border-l">{data.tkKb.pegawai}</td>
                  <td className="px-4 py-3 text-center">{data.tkKb.siswa}</td>
                  <td className="px-4 py-3 text-center border-l">{data.totalPegawai}</td>
                  <td className="px-4 py-3 text-center">{data.totalSiswa}</td>
                  <td className="px-4 py-3 text-center border-l">
                    <span className="text-xs text-muted-foreground">{totalSudah}/12</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-700" />
                Detail Laporan {selected.nama} – T.A. {data.tahunAjaran}
              </h3>
              <button
                onClick={() => setDetailMonth(null)}
                className="text-xs text-muted-foreground hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>

            <div className="flex border-b">
              <button
                onClick={() => setDetailJenjang('sd')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
                  detailJenjang === 'sd'
                    ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                    : 'text-muted-foreground hover:bg-slate-50'
                }`}
              >
                SD
              </button>
              <button
                onClick={() => setDetailJenjang('tkKb')}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
                  detailJenjang === 'tkKb'
                    ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                    : 'text-muted-foreground hover:bg-slate-50'
                }`}
              >
                TK/KB
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Data Pegawai
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{selJenjang!.pegawai.total}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Guru</span>
                    <span className="font-semibold">{selJenjang!.pegawai.guru}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Tenaga Kependidikan</span>
                    <span className="font-semibold">{selJenjang!.pegawai.tendik}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Laki-laki</span>
                    <span className="font-semibold">{selJenjang!.pegawai.l}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Perempuan</span>
                    <span className="font-semibold">{selJenjang!.pegawai.p}</span>
                  </div>
                </div>
                <a
                  href="https://simpeg-tim.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Lihat Detail di SIMPEG
                </a>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Data Siswa
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold">{selJenjang!.siswa.total}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Laki-laki</span>
                    <span className="font-semibold">{selJenjang!.siswa.l}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b">
                    <span className="text-muted-foreground">Perempuan</span>
                    <span className="font-semibold">{selJenjang!.siswa.p}</span>
                  </div>
                </div>
                <a
                  href="https://simdawa.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Lihat Detail di SIMDAWA
                </a>
              </div>
            </div>
          </div>
        )}

        {/* School List */}
        <details className="bg-white rounded-xl border p-4 shadow-sm">
          <summary className="text-sm font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
            <ChevronDown className="w-4 h-4" />
            Daftar Sekolah ({data.sekolah.length})
          </summary>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
            {data.sekolah.map((s) => (
              <span key={s} className="text-xs text-muted-foreground px-2 py-1 bg-slate-50 rounded">
                {s}
              </span>
            ))}
          </div>
        </details>

        {/* Cetak Daftar 1 per Sekolah */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden print-area">
          <div className="px-5 py-4 border-b bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-700" />
              <h2 className="font-semibold text-slate-800">Cetak Daftar 1 per Sekolah</h2>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari sekolah..."
                value={schoolFilter}
                onChange={(e) => { setSchoolFilter(e.target.value); setSelectedSchool(''); }}
                className="text-sm border rounded-lg px-3 py-1.5 w-48"
              />
              {selectedDetail && (
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Cetak
                </button>
              )}
            </div>
          </div>

          {/* School Selector */}
          <div className="p-4 no-print">
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 w-full sm:w-96 bg-white shadow-sm"
            >
              <option value="">-- Pilih Sekolah --</option>
              {detailSekolah.map((s) => (
                <option key={s.nama} value={s.nama}>
                  {s.nama} (Pegawai: {s.totalPegawai} | Siswa: {s.totalSiswa})
                </option>
              ))}
            </select>
          </div>

          {/* Per School Detail */}
          {selectedDetail && (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Kop */}
              <div className="text-center border-b pb-3">
                <h3 className="text-lg font-bold uppercase">{selectedDetail.nama}</h3>
                <p className="text-sm text-muted-foreground">NPSN: {selectedDetail.npsn || '-'}</p>
                <p className="text-xs text-muted-foreground">Kecamatan Lemahabang, Kabupaten Cirebon</p>
              </div>

              {/* Tabel Siswa */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  Data Siswa
                </h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">No</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Kelas</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-600">L</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-600">P</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-600">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedDetail.siswa.map((k, i) => (
                        <tr key={k.kelas} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-1.5 font-medium">{k.kelas}</td>
                          <td className="px-3 py-1.5 text-center">{k.l}</td>
                          <td className="px-3 py-1.5 text-center">{k.p}</td>
                          <td className="px-3 py-1.5 text-center font-semibold">{k.total}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={2} className="px-3 py-1.5">Jumlah</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.totalSiswaL}</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.totalSiswaP}</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.totalSiswa}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Tabel Pegawai */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Data Pegawai
                </h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-3 py-2 text-left font-semibold text-slate-600" rowSpan={2}>No</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600" rowSpan={2}>Jenis ASN</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-600" colSpan={2}>Gender</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-600" colSpan={4}>Masa Kerja</th>
                        <th className="px-3 py-2 text-center font-semibold text-slate-600" rowSpan={2}>Jumlah</th>
                      </tr>
                      <tr className="bg-slate-50 text-xs text-muted-foreground">
                        <th className="px-2 py-1 text-center font-medium">L</th>
                        <th className="px-2 py-1 text-center font-medium">P</th>
                        <th className="px-2 py-1 text-center font-medium">&lt;5 th</th>
                        <th className="px-2 py-1 text-center font-medium">5-10 th</th>
                        <th className="px-2 py-1 text-center font-medium">10-20 th</th>
                        <th className="px-2 py-1 text-center font-medium">&gt;20 th</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedDetail.pegawai.map((a, i) => (
                        <tr key={a.jenis} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-1.5 font-medium">{a.jenis}</td>
                          <td className="px-3 py-1.5 text-center">{a.l}</td>
                          <td className="px-3 py-1.5 text-center">{a.p}</td>
                          <td className="px-3 py-1.5 text-center">{a.masaKerja['<5']}</td>
                          <td className="px-3 py-1.5 text-center">{a.masaKerja['5-10']}</td>
                          <td className="px-3 py-1.5 text-center">{a.masaKerja['10-20']}</td>
                          <td className="px-3 py-1.5 text-center">{a.masaKerja['>20']}</td>
                          <td className="px-3 py-1.5 text-center font-semibold">{a.total}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={2} className="px-3 py-1.5">Jumlah</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.totalPegawaiL}</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.totalPegawaiP}</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.pegawai.reduce((sum, a) => sum + a.masaKerja['<5'], 0)}</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.pegawai.reduce((sum, a) => sum + a.masaKerja['5-10'], 0)}</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.pegawai.reduce((sum, a) => sum + a.masaKerja['10-20'], 0)}</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.pegawai.reduce((sum, a) => sum + a.masaKerja['>20'], 0)}</td>
                        <td className="px-3 py-1.5 text-center">{selectedDetail.totalPegawai}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!selectedDetail && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Pilih sekolah untuk melihat detail Daftar 1
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .max-w-7xl > *:not(.print-area) { display: none !important; }
          .print-area { display: block !important; box-shadow: none !important; border: none !important; }
          .print-area .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
