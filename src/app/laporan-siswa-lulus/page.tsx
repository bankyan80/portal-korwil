'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  GraduationCap, Users, BookOpen,
  Loader2, School, Search, ArrowRight, XCircle,
  Plus, Trash2, ChevronDown, ChevronUp, Save,
} from 'lucide-react';

interface SiswaAlumni {
  sekolah: string;
  jk: string;
}

interface AlumniSekolah {
  nama: string;
  l: number;
  p: number;
  total: number;
}

interface AlumniLanjut {
  id: string;
  nama: string;
  jk: string;
  asalSekolah: string;
  tujuanSekolah: string;
  alamatTujuan: string;
}

interface AlumniTidakLanjut {
  id: string;
  nama: string;
  jk: string;
  asalSekolah: string;
  alasan: string;
}

async function fetchAlumni(): Promise<SiswaAlumni[]> {
  const all: SiswaAlumni[] = [];
  const limit = 5000;
  let page = 1;
  while (true) {
    const res = await fetch(`/api/proxy/simdawa?page=${page}&limit=${limit}`);
    const json = await res.json();
    const data: any[] = json.siswa || [];
    if (data.length === 0) break;
    for (const s of data) {
      if (s.statusSiswa !== 'Aktif') continue;
      const kelas = (s.kelasKelompok || '').trim();
      if (kelas !== '6' && kelas !== 'VI') continue;
      all.push({
        sekolah: s.sekolah?.namaSekolah || '',
        jk: s.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
      });
    }
    if (data.length < limit) break;
    page++;
  }
  return all;
}

const MOCK_LANJUT: AlumniLanjut[] = [
  { id: 'l1', nama: 'Ahmad Rizki', jk: 'L', asalSekolah: 'SD NEGERI 1 LEMAHABANG', tujuanSekolah: 'SMP NEGERI 1 LEMAHABANG', alamatTujuan: 'Jl. Raya Lemahabang No. 1, Lemahabang, Cirebon' },
  { id: 'l2', nama: 'Siti Nurjanah', jk: 'P', asalSekolah: 'SD NEGERI 1 LEMAHABANG', tujuanSekolah: 'MTs NEGERI 1 CIREBON', alamatTujuan: 'Jl. By Pass No. 10, Kota Cirebon' },
  { id: 'l3', nama: 'Budi Santoso', jk: 'L', asalSekolah: 'SD NEGERI 2 LEMAHABANG', tujuanSekolah: 'SMP NEGERI 2 LEMAHABANG', alamatTujuan: 'Jl. Raya Sigong No. 5, Lemahabang, Cirebon' },
  { id: 'l4', nama: 'Dewi Lestari', jk: 'P', asalSekolah: 'SD NEGERI 2 LEMAHABANG', tujuanSekolah: 'SMP NEGERI 1 LEMAHABANG', alamatTujuan: 'Jl. Raya Lemahabang No. 1, Lemahabang, Cirebon' },
  { id: 'l5', nama: 'Rudi Hermawan', jk: 'L', asalSekolah: 'SD NEGERI 1 ASEM', tujuanSekolah: 'SMP NEGERI 1 LEMAHABANG', alamatTujuan: 'Jl. Raya Lemahabang No. 1, Lemahabang, Cirebon' },
  { id: 'l6', nama: 'Ani Rahmawati', jk: 'P', asalSekolah: 'SD NEGERI 1 ASEM', tujuanSekolah: 'MTs AL-HIDAYAH', alamatTujuan: 'Jl. Desa Asem No. 3, Asem, Lemahabang, Cirebon' },
  { id: 'l7', nama: 'Joko Susilo', jk: 'L', asalSekolah: 'SD NEGERI 1 BELAWA', tujuanSekolah: 'SMP NEGERI 1 LEMAHABANG', alamatTujuan: 'Jl. Raya Lemahabang No. 1, Lemahabang, Cirebon' },
  { id: 'l8', nama: 'Rina Marlina', jk: 'P', asalSekolah: 'SD NEGERI 1 BELAWA', tujuanSekolah: 'SMP NEGERI 2 LEMAHABANG', alamatTujuan: 'Jl. Raya Sigong No. 5, Lemahabang, Cirebon' },
  { id: 'l9', nama: 'Agus Prasetyo', jk: 'L', asalSekolah: 'SD NEGERI 1 SIGONG', tujuanSekolah: 'SMP NEGERI 2 LEMAHABANG', alamatTujuan: 'Jl. Raya Sigong No. 5, Lemahabang, Cirebon' },
  { id: 'l10', nama: 'Fitri Handayani', jk: 'P', asalSekolah: 'SD NEGERI 1 SIGONG', tujuanSekolah: 'MTs NEGERI 1 CIREBON', alamatTujuan: 'Jl. By Pass No. 10, Kota Cirebon' },
];

const MOCK_TIDAK_LANJUT: AlumniTidakLanjut[] = [
  { id: 'tl1', nama: 'Cecep Gunawan', jk: 'L', asalSekolah: 'SD NEGERI 1 LEMAHABANG', alasan: 'Bekerja membantu orang tua' },
  { id: 'tl2', nama: 'Maya Sari', jk: 'P', asalSekolah: 'SD NEGERI 1 LEMAHABANG', alasan: 'Kendala biaya' },
  { id: 'tl3', nama: 'Asep Saepudin', jk: 'L', asalSekolah: 'SD NEGERI 2 BELAWA', alasan: 'Menikah' },
  { id: 'tl4', nama: 'Neneng Hasanah', jk: 'P', asalSekolah: 'SD NEGERI 1 LEMAHABANG KULON', alasan: 'Mengikuti orang tua pindah ke luar kota' },
  { id: 'tl5', nama: 'Dede kusnadi', jk: 'L', asalSekolah: 'SD NEGERI 1 PICUNGPUGUR', alasan: 'Kendala biaya' },
];

function loadData<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveData<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export default function RekapAlumniPage() {
  const [alumni, setAlumni] = useState<SiswaAlumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'lulus' | 'lanjut' | 'tidak-lanjut'>('lulus');

  // Lanjut data
  const [lanjutList, setLanjutList] = useState<AlumniLanjut[]>([]);
  const [showFormLanjut, setShowFormLanjut] = useState(false);
  const [formLanjut, setFormLanjut] = useState({ nama: '', jk: 'L', asalSekolah: '', tujuanSekolah: '', alamatTujuan: '' });

  // Tidak Lanjut data
  const [tidakLanjutList, setTidakLanjutList] = useState<AlumniTidakLanjut[]>([]);
  const [showFormTidakLanjut, setShowFormTidakLanjut] = useState(false);
  const [formTidakLanjut, setFormTidakLanjut] = useState({ nama: '', jk: 'L', asalSekolah: '', alasan: '' });

  // Expanded schools
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAlumni()
      .then(setAlumni)
      .catch(console.error)
      .finally(() => setLoading(false));
    setLanjutList(loadData<AlumniLanjut>('rekap-lanjut', MOCK_LANJUT));
    setTidakLanjutList(loadData<AlumniTidakLanjut>('rekap-tidak-lanjut', MOCK_TIDAK_LANJUT));
  }, []);

  const perSekolah = useMemo(() => {
    const map = new Map<string, AlumniSekolah>();
    for (const s of alumni) {
      let entry = map.get(s.sekolah);
      if (!entry) {
        entry = { nama: s.sekolah, l: 0, p: 0, total: 0 };
        map.set(s.sekolah, entry);
      }
      entry.total++;
      if (s.jk === 'L') entry.l++;
      else entry.p++;
    }
    const list = Array.from(map.values());
    list.sort((a, b) => a.nama.localeCompare(b.nama));
    return list;
  }, [alumni]);

  const filteredLulus = perSekolah.filter(
    (s) => s.nama.toLowerCase().includes(search.toLowerCase())
  );

  const totalL = perSekolah.reduce((s, x) => s + x.l, 0);
  const totalP = perSekolah.reduce((s, x) => s + x.p, 0);
  const totalAll = perSekolah.reduce((s, x) => s + x.total, 0);

  // Group lanjut by sekolah
  const lanjutBySekolah = useMemo(() => {
    const map = new Map<string, AlumniLanjut[]>();
    for (const item of lanjutList) {
      const arr = map.get(item.asalSekolah) || [];
      arr.push(item);
      map.set(item.asalSekolah, arr);
    }
    return map;
  }, [lanjutList]);

  const filteredSekolahLanjut = Array.from(lanjutBySekolah.keys())
    .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    .sort();

  // Group tidak lanjut by sekolah
  const tidakLanjutBySekolah = useMemo(() => {
    const map = new Map<string, AlumniTidakLanjut[]>();
    for (const item of tidakLanjutList) {
      const arr = map.get(item.asalSekolah) || [];
      arr.push(item);
      map.set(item.asalSekolah, arr);
    }
    return map;
  }, [tidakLanjutList]);

  const filteredSekolahTidakLanjut = Array.from(tidakLanjutBySekolah.keys())
    .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    .sort();

  const totalLanjut = lanjutList.length;
  const totalTidakLanjut = tidakLanjutList.length;

  function toggleExpand(sekolah: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(sekolah)) next.delete(sekolah);
      else next.add(sekolah);
      return next;
    });
  }

  function addLanjut() {
    const item: AlumniLanjut = {
      id: 'l-' + Date.now(),
      ...formLanjut,
    };
    const updated = [...lanjutList, item];
    setLanjutList(updated);
    saveData('rekap-lanjut', updated);
    setFormLanjut({ nama: '', jk: 'L', asalSekolah: '', tujuanSekolah: '', alamatTujuan: '' });
    setShowFormLanjut(false);
  }

  function deleteLanjut(id: string) {
    const updated = lanjutList.filter((item) => item.id !== id);
    setLanjutList(updated);
    saveData('rekap-lanjut', updated);
  }

  function addTidakLanjut() {
    const item: AlumniTidakLanjut = {
      id: 'tl-' + Date.now(),
      ...formTidakLanjut,
    };
    const updated = [...tidakLanjutList, item];
    setTidakLanjutList(updated);
    saveData('rekap-tidak-lanjut', updated);
    setFormTidakLanjut({ nama: '', jk: 'L', asalSekolah: '', alasan: '' });
    setShowFormTidakLanjut(false);
  }

  function deleteTidakLanjut(id: string) {
    const updated = tidakLanjutList.filter((item) => item.id !== id);
    setTidakLanjutList(updated);
    saveData('rekap-tidak-lanjut', updated);
  }

  const sekolahOptions = perSekolah.map((s) => s.nama);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-700 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memuat data alumni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-700" />
            Rekap Alumni SD
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Data kelulusan dan penelusuran alumni SD se-Kecamatan Lemahabang, Kabupaten Cirebon
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <School className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{perSekolah.length}</p>
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
                <p className="text-2xl font-bold text-slate-900">{totalAll}</p>
                <p className="text-xs text-muted-foreground">Total Alumni</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalLanjut}</p>
                <p className="text-xs text-muted-foreground">Melanjutkan</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalTidakLanjut}</p>
                <p className="text-xs text-muted-foreground">Tidak Melanjutkan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            onClick={() => setTab('lulus')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
              tab === 'lulus'
                ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                : 'text-muted-foreground hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4 inline mr-1.5" />
            Kelulusan
          </button>
          <button
            onClick={() => setTab('lanjut')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
              tab === 'lanjut'
                ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                : 'text-muted-foreground hover:bg-slate-50'
            }`}
          >
            <ArrowRight className="w-4 h-4 inline mr-1.5" />
            Melanjutkan
          </button>
          <button
            onClick={() => setTab('tidak-lanjut')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors ${
              tab === 'tidak-lanjut'
                ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50'
                : 'text-muted-foreground hover:bg-slate-50'
            }`}
          >
            <XCircle className="w-4 h-4 inline mr-1.5" />
            Tidak Melanjutkan
          </button>
        </div>

        {/* Tab Content: Kelulusan */}
        {tab === 'lulus' && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-700" />
                <h2 className="font-semibold text-slate-800">
                  Rekap Kelulusan per Sekolah
                </h2>
                <span className="text-xs text-muted-foreground ml-2">
                  {filteredLulus.length} sekolah
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-600 w-10">No</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Nama Sekolah</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">L</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">P</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLulus.map((s, i) => (
                    <tr key={s.nama} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{s.nama}</td>
                      <td className="px-4 py-3 text-center font-semibold text-cyan-700">{s.l}</td>
                      <td className="px-4 py-3 text-center font-semibold text-pink-700">{s.p}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{s.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <td colSpan={2} className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-center text-cyan-700">{filteredLulus.reduce((s, x) => s + x.l, 0)}</td>
                    <td className="px-4 py-3 text-center text-pink-700">{filteredLulus.reduce((s, x) => s + x.p, 0)}</td>
                    <td className="px-4 py-3 text-center">{filteredLulus.reduce((s, x) => s + x.total, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Melanjutkan */}
        {tab === 'lanjut' && (
          <div className="space-y-4">
            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFormLanjut(!showFormLanjut)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Data
              </button>
            </div>

            {/* Form Tambah */}
            {showFormLanjut && (
              <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm">Tambah Siswa Melanjutkan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <input
                    placeholder="Nama siswa"
                    value={formLanjut.nama}
                    onChange={(e) => setFormLanjut({ ...formLanjut, nama: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  />
                  <select
                    value={formLanjut.jk}
                    onChange={(e) => setFormLanjut({ ...formLanjut, jk: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  <select
                    value={formLanjut.asalSekolah}
                    onChange={(e) => setFormLanjut({ ...formLanjut, asalSekolah: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  >
                    <option value="">Asal Sekolah</option>
                    {sekolahOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Tujuan sekolah"
                    value={formLanjut.tujuanSekolah}
                    onChange={(e) => setFormLanjut({ ...formLanjut, tujuanSekolah: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  />
                  <input
                    placeholder="Alamat lengkap tujuan"
                    value={formLanjut.alamatTujuan}
                    onChange={(e) => setFormLanjut({ ...formLanjut, alamatTujuan: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addLanjut}
                    disabled={!formLanjut.nama || !formLanjut.asalSekolah || !formLanjut.tujuanSekolah}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                  <button
                    onClick={() => setShowFormLanjut(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Per-school expandable list */}
            {filteredSekolahLanjut.length === 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
                <ArrowRight className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700">Belum Ada Data</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Tambahkan data siswa yang melanjutkan ke jenjang SMP/MTs/sederajat.
                </p>
              </div>
            )}

            {filteredSekolahLanjut.map((sekolah) => {
              const siswa = lanjutBySekolah.get(sekolah)!;
              const isOpen = expanded.has(sekolah);
              return (
                <div key={sekolah} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleExpand(sekolah)}
                    className="w-full px-5 py-3 border-b bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors text-left"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{sekolah}</span>
                      <span className="text-xs text-muted-foreground ml-3">{siswa.length} siswa</span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left">
                            <th className="px-4 py-2 font-semibold text-slate-600 w-10">No</th>
                            <th className="px-4 py-2 font-semibold text-slate-600">Nama Siswa</th>
                            <th className="px-4 py-2 font-semibold text-slate-600 text-center w-12">L/P</th>
                            <th className="px-4 py-2 font-semibold text-slate-600">Tujuan Sekolah</th>
                            <th className="px-4 py-2 font-semibold text-slate-600">Alamat Lengkap</th>
                            <th className="px-4 py-2 font-semibold text-slate-600 text-center w-16">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {siswa.map((item, i) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                              <td className="px-4 py-2 font-medium text-slate-800">{item.nama}</td>
                              <td className="px-4 py-2 text-center font-semibold">{item.jk}</td>
                              <td className="px-4 py-2">{item.tujuanSekolah}</td>
                              <td className="px-4 py-2 text-xs text-muted-foreground max-w-xs truncate">{item.alamatTujuan}</td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => deleteLanjut(item.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: Tidak Melanjutkan */}
        {tab === 'tidak-lanjut' && (
          <div className="space-y-4">
            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFormTidakLanjut(!showFormTidakLanjut)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Data
              </button>
            </div>

            {/* Form Tambah */}
            {showFormTidakLanjut && (
              <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm">Tambah Siswa Tidak Melanjutkan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    placeholder="Nama siswa"
                    value={formTidakLanjut.nama}
                    onChange={(e) => setFormTidakLanjut({ ...formTidakLanjut, nama: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  />
                  <select
                    value={formTidakLanjut.jk}
                    onChange={(e) => setFormTidakLanjut({ ...formTidakLanjut, jk: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                  <select
                    value={formTidakLanjut.asalSekolah}
                    onChange={(e) => setFormTidakLanjut({ ...formTidakLanjut, asalSekolah: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  >
                    <option value="">Asal Sekolah</option>
                    {sekolahOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Alasan tidak melanjutkan"
                    value={formTidakLanjut.alasan}
                    onChange={(e) => setFormTidakLanjut({ ...formTidakLanjut, alasan: e.target.value })}
                    className="text-sm border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addTidakLanjut}
                    disabled={!formTidakLanjut.nama || !formTidakLanjut.asalSekolah || !formTidakLanjut.alasan}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                  <button
                    onClick={() => setShowFormTidakLanjut(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Per-school expandable list */}
            {filteredSekolahTidakLanjut.length === 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
                <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-slate-700">Belum Ada Data</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Tambahkan data siswa yang tidak melanjutkan pendidikan.
                </p>
              </div>
            )}

            {filteredSekolahTidakLanjut.map((sekolah) => {
              const siswa = tidakLanjutBySekolah.get(sekolah)!;
              const isOpen = expanded.has(sekolah);
              return (
                <div key={sekolah} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleExpand(sekolah)}
                    className="w-full px-5 py-3 border-b bg-slate-50 flex items-center justify-between hover:bg-slate-100 transition-colors text-left"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{sekolah}</span>
                      <span className="text-xs text-muted-foreground ml-3">{siswa.length} siswa</span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-left">
                            <th className="px-4 py-2 font-semibold text-slate-600 w-10">No</th>
                            <th className="px-4 py-2 font-semibold text-slate-600">Nama Siswa</th>
                            <th className="px-4 py-2 font-semibold text-slate-600 text-center w-12">L/P</th>
                            <th className="px-4 py-2 font-semibold text-slate-600">Alasan Tidak Melanjutkan</th>
                            <th className="px-4 py-2 font-semibold text-slate-600 text-center w-16">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {siswa.map((item, i) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                              <td className="px-4 py-2 font-medium text-slate-800">{item.nama}</td>
                              <td className="px-4 py-2 text-center font-semibold">{item.jk}</td>
                              <td className="px-4 py-2 text-red-700">{item.alasan}</td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => deleteTidakLanjut(item.id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Keterangan</p>
          <p>Data alumni SD Kelas 6 dari SIMDAWA: <strong>{totalAll}</strong> siswa dari <strong>{perSekolah.length}</strong> sekolah. Data penelusuran alumni tersimpan di penyimpanan lokal browser.</p>
        </div>
      </div>
    </div>
  );
}
