'use client';

import { useState, useEffect, Fragment, useRef, useCallback } from 'react';
import { ArrowLeft, Search, School, Baby, GraduationCap, Building2, MapPin, Loader2, Users, BookOpen, BadgeCheck, Download, X, ChevronRight, ChevronUp, ChevronDown, Database, ExternalLink, BarChart3 } from 'lucide-react';
import { useSort } from '@/hooks/useSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import Footer from '@/components/portal/Footer';
import { apiGet } from '@/lib/api-firestore';
import { sekolahSD, sekolahTK, sekolahKB } from '@/data/sekolah';
import { rombelData, type RombelEntry, type RombelDetail } from '@/data/rombel';
import { useSekolah, type SekolahItem } from '@/hooks/useSekolah';

const tabs = [
  { id: 'sd', label: 'SD', icon: School },
  { id: 'tk', label: 'TK', icon: Baby },
  { id: 'kb', label: 'KB', icon: GraduationCap },
  { id: 'gtk', label: 'GTK', icon: Users },
  { id: 'pd', label: 'PD', icon: BookOpen },
  { id: 'rombel', label: 'Rombel', icon: Users },
  { id: 'dapodik', label: 'Dapodik', icon: Database },
];

interface SchoolItem {
  name: string;
  npsn: string;
  status: string;
  akreditasi: string;
  address: string;
  desa: string;
}

interface SchoolGtk {
  npsn: string;
  name: string;
  teachers: number;
  staff: number;
  total: number;
  certified: number;
  headmaster: string;
  teachers_l: number;
  teachers_p: number;
  staff_l: number;
  staff_p: number;
  l: number;
  p: number;
}

interface Pegawai {
  nik?: string;
  nama: string;
  nuptk?: string;
  nip?: string;
  jk?: string;
  jenis_ptk: string;
  status_kepegawaian?: string;
  tugas_tambahan?: string;
  mapel?: string;
  sekolah: string;
}

interface SekolahKelas {
  name: string;
  jenjang: string;
  perKelas: Record<string, { l: number; p: number }>;
  totalL: number;
  totalP: number;
}

const jenjangList = ['SD', 'TK', 'KB'] as const;

const jenjangMeta: Record<string, { icon: typeof School; label: string; color: string }> = {
  SD: { icon: School, label: 'Sekolah Dasar', color: 'blue' },
  TK: { icon: Baby, label: 'Taman Kanak-kanak', color: 'pink' },
  KB: { icon: Baby, label: 'Kelompok Belajar', color: 'purple' },
};

const sdKelas = ['1', '2', '3', '4', '5', '6'];
const tkKelas = ['A', 'B'];

function normName(n: string) {
  return n.toLowerCase().replace(/[\s.\-]+/g, '');
}

function matchKey(n: string): string {
  return n.toLowerCase()
    .replace(/^(sd|tk|kb|paud)\s+/i, '')
    .replace(/\s+kecamatan\s+lemahabang$/i, '')
    .replace(/[\s.\-]+/g, '');
}

function buildSekolahData(allSekolah: SekolahItem[], firestoreSd?: SekolahKelas[]) {
  const fbMap = new Map<string, SekolahKelas>();
  if (firestoreSd) {
    for (const s of firestoreSd) fbMap.set(normName(s.name), s);
  }
  const rombelMap = new Map<string, typeof rombelData[0]>();
  for (const r of rombelData) rombelMap.set(normName(r.name), r);

  function findFb(schoolName: string): SekolahKelas | undefined {
    const direct = fbMap.get(normName(schoolName));
    if (direct) return direct;
    const mk = matchKey(schoolName);
    for (const [, v] of fbMap) {
      if (matchKey(v.name) === mk) return v;
    }
    return undefined;
  }

  function findRombel(schoolName: string): typeof rombelData[0] | undefined {
    const direct = rombelMap.get(normName(schoolName));
    if (direct) return direct;
    const mk = matchKey(schoolName);
    for (const r of rombelData) {
      if (matchKey(r.name) === mk) return r;
    }
    return undefined;
  }

  const result: SekolahKelas[] = [];
  for (const school of allSekolah) {
    const fb = findFb(school.nama);
    const rombel = findRombel(school.nama);

    if (fb && school.jenjang === 'SD') {
      result.push({ ...fb, name: school.nama });
    } else if (fb && school.jenjang !== 'SD' && rombel) {
      const perKelas: Record<string, { l: number; p: number }> = {};
      let totalL = 0, totalP = 0;
      for (const d of rombel.details) {
        const k = extractKelas(d.name, rombel.jenjang);
        if (!perKelas[k]) perKelas[k] = { l: 0, p: 0 };
        perKelas[k].l += d.l;
        perKelas[k].p += d.p;
        totalL += d.l;
        totalP += d.p;
      }
      result.push({ name: school.nama, jenjang: school.jenjang, perKelas, totalL, totalP });
    } else if (fb) {
      result.push({ ...fb, name: school.nama });
    } else if (rombel) {
      const perKelas: Record<string, { l: number; p: number }> = {};
      let totalL = 0, totalP = 0;
      for (const d of rombel.details) {
        const k = extractKelas(d.name, rombel.jenjang);
        if (!perKelas[k]) perKelas[k] = { l: 0, p: 0 };
        perKelas[k].l += d.l;
        perKelas[k].p += d.p;
        totalL += d.l;
        totalP += d.p;
      }
      result.push({ name: school.nama, jenjang: school.jenjang, perKelas, totalL, totalP });
    } else {
      result.push({ name: school.nama, jenjang: school.jenjang, perKelas: {}, totalL: 0, totalP: 0 });
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function extractKelas(name: string, jenjang: string): string {
  if (jenjang === 'SD') {
    const m = name.match(/Kelas\s+(\d+)/i);
    return m ? m[1] : name;
  }
  if (jenjang === 'TK' || jenjang === 'KB') {
    const m = name.match(/([A-E])/i);
    return m ? m[1].toUpperCase() : name;
  }
  return name;
}

function aggregateRombel(students: any[]): RombelEntry[] {
  const bySchool = new Map<string, any[]>();
  for (const s of students) {
    const key = s.sekolah;
    if (!key) continue;
    if (!bySchool.has(key)) bySchool.set(key, []);
    bySchool.get(key)!.push(s);
  }
  const result: RombelEntry[] = [];
  for (const [schoolName, siswa] of bySchool) {
    const jenjang = siswa[0]?.jenjang || '-';
    const byRombel = new Map<string, { l: number; p: number }>();
    for (const s of siswa) {
      const rombel = s.rombel || 'Tanpa Rombel';
      if (!byRombel.has(rombel)) byRombel.set(rombel, { l: 0, p: 0 });
      const entry = byRombel.get(rombel)!;
      if (s.jk === 'L' || s.jk === 'Laki-laki') entry.l++;
      else entry.p++;
    }
    const details: RombelDetail[] = Array.from(byRombel.entries())
      .map(([name, counts]) => ({ name, l: counts.l, p: counts.p, total: counts.l + counts.p }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const total = details.reduce((sum, d) => sum + d.total, 0);
    result.push({ name: schoolName, jenjang, total, rombels: details.length, details });
  }
  const jenjangOrder: Record<string, number> = { SD: 0, TK: 1, KB: 2 };
  return result.sort((a, b) => {
    const ao = jenjangOrder[a.jenjang] ?? 99;
    const bo = jenjangOrder[b.jenjang] ?? 99;
    return ao !== bo ? ao - bo : a.name.localeCompare(b.name);
  });
}

function deriveJenis(nama: string): string {
  if (nama.startsWith('KB ')) return 'KB';
  if (nama.includes('SPS')) return 'SPS';
  return 'KB';
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && tabs.some(t => t.id === tab)) return tab;
    }
    return 'sd';
  });

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
              <Database className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Master Data</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <div className="sticky top-14 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', tab.id);
                    window.history.replaceState({}, '', url.toString());
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#0d3b66] text-white shadow-md'
                      : 'text-gray-500 hover:text-[#0d3b66] hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeTab === 'sd' && <TabSD />}
        {activeTab === 'tk' && <TabTK />}
        {activeTab === 'kb' && <TabKB />}
        {activeTab === 'gtk' && <TabGTK />}
        {activeTab === 'pd' && <TabPD />}
        {activeTab === 'rombel' && <TabRombel />}
        {activeTab === 'dapodik' && <TabDapodik />}
      </main>

      <Footer />
    </div>
  );
}

function TabSD() {
  const fallbackSD: SchoolItem[] = sekolahSD.map(s => ({
    name: s.nama,
    npsn: s.npsn,
    status: s.status,
    akreditasi: s.akreditasi,
    address: s.address,
    desa: s.desa,
  }));

  const [schools, setSchools] = useState<SchoolItem[]>(fallbackSD);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiGet('schools').then((res) => {
      const all = (res.items || []) as any[];
      if (all.length > 0) {
        const filtered: SchoolItem[] = all
          .filter((s: any) => s.jenjang === 'SD')
          .map((s: any) => ({
            name: s.name || s.nama || '',
            npsn: s.npsn || '-',
            status: s.status || 'NEGERI',
            akreditasi: s.akreditasi || '-',
            address: s.alamat || '',
            desa: s.desa || '',
          }));
        if (filtered.length > 0) setSchools(filtered);
      }
      setLoading(false);
    }).catch((e) => {
      console.error('Gagal memuat data SD:', e);
      setLoading(false);
    });
  }, []);

  const totalNegeri = schools.filter(s => s.status === 'NEGERI').length;
  const totalSwasta = schools.filter(s => s.status === 'SWASTA').length;
  const filtered = schools.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search) || s.desa.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortKey, sortDir, toggle } = useSort(filtered, 'name');

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-[#0d3b66]">Data Sekolah Dasar</h2>
        <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><School className="w-5 h-5 text-blue-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{schools.length}</p><p className="text-xs text-gray-500">Total SD</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-green-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{totalNegeri}</p><p className="text-xs text-gray-500">Negeri</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-orange-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{totalSwasta}</p><p className="text-xs text-gray-500">Swasta</p></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-[#0d3b66]">Daftar SD</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left group">
                <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                <SortableHeader label="Nama Sekolah" sortKey="name" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="NPSN" sortKey="npsn" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Status" sortKey="status" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Akreditasi" sortKey="akreditasi" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Alamat" sortKey="address" currentKey={sortKey} direction={sortDir} onToggle={toggle} hideBelow="md" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(() => {
                if (loading) return <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Memuat data...</td></tr>;
                if (filtered.length === 0) return <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada data</td></tr>;
                return sorted.map((school, i) => (
                  <tr key={school.npsn} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-[#0d3b66]">{school.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{school.npsn}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.status === 'NEGERI' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{school.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.akreditasi === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{school.akreditasi}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{school.address}</div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TabTK() {
  const fallbackTK: SchoolItem[] = sekolahTK.map(s => ({
    name: s.nama,
    npsn: s.npsn,
    status: s.status,
    akreditasi: s.akreditasi,
    address: s.address,
    desa: s.desa,
  }));

  const [schools, setSchools] = useState<SchoolItem[]>(fallbackTK);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiGet('schools').then((res) => {
      const all = (res.items || []) as any[];
      if (all.length > 0) {
        const filtered: SchoolItem[] = all
          .filter((s: any) => s.jenjang === 'TK')
          .map((s: any) => ({
            name: s.name || s.nama || '',
            npsn: s.npsn || '-',
            status: s.status || 'NEGERI',
            akreditasi: s.akreditasi || '-',
            address: s.alamat || '',
            desa: s.desa || '',
          }));
        if (filtered.length > 0) setSchools(filtered);
      }
      setLoading(false);
    }).catch((e) => {
      console.error('Gagal memuat data TK:', e);
      setLoading(false);
    });
  }, []);

  const totalNegeri = schools.filter(s => s.status === 'NEGERI').length;
  const totalSwasta = schools.filter(s => s.status === 'SWASTA').length;
  const filtered = schools.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search) || s.desa.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortKey, sortDir, toggle } = useSort(filtered, 'name');

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-[#0d3b66]">Data Taman Kanak-Kanak</h2>
        <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Baby className="w-5 h-5 text-emerald-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{schools.length}</p><p className="text-xs text-gray-500">Total TK</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-green-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{totalNegeri}</p><p className="text-xs text-gray-500">Negeri</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-orange-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{totalSwasta}</p><p className="text-xs text-gray-500">Swasta</p></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-[#0d3b66]">Daftar TK</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari TK..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left group">
                <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                <SortableHeader label="Nama TK" sortKey="name" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="NPSN" sortKey="npsn" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Status" sortKey="status" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Akreditasi" sortKey="akreditasi" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Alamat" sortKey="address" currentKey={sortKey} direction={sortDir} onToggle={toggle} hideBelow="md" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(() => {
                if (loading) return <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Memuat data...</td></tr>;
                if (filtered.length === 0) return <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada data</td></tr>;
                return sorted.map((school, i) => (
                  <tr key={school.npsn} className="hover:bg-emerald-50/50 transition-colors">
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-[#0d3b66]">{school.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{school.npsn}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.status === 'NEGERI' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{school.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.akreditasi === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{school.akreditasi}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{school.address}</div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TabKB() {
  const fallbackPAUD: SchoolItem[] = sekolahKB.map(s => ({
    name: s.nama,
    npsn: s.npsn,
    status: s.status,
    akreditasi: s.akreditasi,
    jenis: deriveJenis(s.nama),
    address: s.address,
    desa: s.desa,
  }));

  const [schools, setSchools] = useState<SchoolItem[]>(fallbackPAUD);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiGet('schools').then((res) => {
      const all = (res.items || []) as any[];
      if (all.length > 0) {
        const filtered: SchoolItem[] = all
          .filter((s: any) => s.jenjang === 'KB' || s.jenjang === 'PAUD' || s.jenjang === 'SPS')
          .map((s: any) => ({
            name: s.name || s.nama || '',
            npsn: s.npsn || '-',
            status: s.status || 'SWASTA',
            akreditasi: s.akreditasi || '-',
            jenis: s.jenjang || 'KB',
            address: s.alamat || '',
            desa: s.desa || '',
          }));
        if (filtered.length > 0) setSchools(filtered);
      }
      setLoading(false);
    }).catch((e) => {
      console.error('Gagal memuat data PAUD:', e);
      setLoading(false);
    });
  }, []);

  const filtered = schools.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.npsn.includes(search) || s.desa.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortKey, sortDir, toggle } = useSort(filtered, 'name');

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-[#0d3b66]">Data PAUD / KB</h2>
        <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-purple-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{schools.length}</p><p className="text-xs text-gray-500">Total PAUD</p></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-[#0d3b66]">Daftar PAUD</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari PAUD..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left group">
                <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                <SortableHeader label="Nama PAUD" sortKey="name" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="NPSN" sortKey="npsn" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Jenis" sortKey="jenis" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Status" sortKey="status" currentKey={sortKey} direction={sortDir} onToggle={toggle} />
                <SortableHeader label="Akreditasi" sortKey="akreditasi" currentKey={sortKey} direction={sortDir} onToggle={toggle} hideBelow="md" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(() => {
                if (loading) return <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Memuat data...</td></tr>;
                if (filtered.length === 0) return <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada data</td></tr>;
                return sorted.map((school, i) => (
                  <tr key={school.npsn} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-[#0d3b66]">{school.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{school.npsn}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-purple-100 text-purple-700">{(school as any).jenis}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${school.status === 'NEGERI' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{school.status}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${(school as any).akreditasi === 'A' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{school.akreditasi || '-'}</span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function TabGTK() {
  const [schoolData, setSchoolData] = useState<SchoolGtk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pegawaiSearch, setPegawaiSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [pegawaiLoading, setPegawaiLoading] = useState(false);
  const [allPegawai, setAllPegawai] = useState<Pegawai[] | null>(null);

  const refreshInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [summaryRes, pegRes] = await Promise.all([
          fetch('/api/pegawai/gtk-summary'),
          fetch('/api/pegawai/all?all=true'),
        ]);
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSchoolData(data.schools || []);
        }
        if (pegRes.ok) {
          const data = await pegRes.json();
          setAllPegawai(data.items || []);
        }
      } catch (e) {
        console.error('Gagal memuat data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();

    refreshInterval.current = setInterval(() => {
      fetch('/api/pegawai/gtk-summary')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.schools) setSchoolData(d.schools); })
        .catch(() => {});
    }, 30000);

    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, []);

  const handleSchoolClick = useCallback(async (schoolName: string) => {
    setSelectedSchool(schoolName);
    setPegawaiLoading(true);
    setPegawaiList([]);
    if (allPegawai) {
      const filtered = allPegawai.filter((p: Pegawai) =>
        p.sekolah?.toLowerCase() === schoolName.toLowerCase()
      );
      setPegawaiList(filtered);
    }
    setPegawaiLoading(false);
  }, [allPegawai]);

  const totalGTK = schoolData.reduce((a, s) => a + s.total, 0);
  const totalTeachers = schoolData.reduce((a, s) => a + s.teachers, 0);
  const totalStaff = schoolData.reduce((a, s) => a + s.staff, 0);
  const totalCertified = schoolData.reduce((a, s) => a + s.certified, 0);
  const totalL = schoolData.reduce((a, s) => a + s.l, 0);
  const totalP = schoolData.reduce((a, s) => a + s.p, 0);
  const totalTeachersL = schoolData.reduce((a, s) => a + s.teachers_l, 0);
  const totalTeachersP = schoolData.reduce((a, s) => a + s.teachers_p, 0);
  const totalStaffL = schoolData.reduce((a, s) => a + s.staff_l, 0);
  const totalStaffP = schoolData.reduce((a, s) => a + s.staff_p, 0);

  const filteredData = schoolData.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.npsn || '').includes(search);
  });

  const { sorted, sortKey, sortDir, toggle } = useSort(filteredData, 'name');

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-[#0d3b66]">Data Guru dan Tenaga Kependidikan</h2>
        <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalGTK}</p><p className="text-xs text-gray-500">Total GTK</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-emerald-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalTeachers}</p><p className="text-xs text-gray-500">Guru</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-purple-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalStaff}</p><p className="text-xs text-gray-500">Tenaga Pendidik</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center"><Users className="w-5 h-5 text-cyan-700" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-700">{loading ? '-' : totalL}</span>
                  <span className="text-xs text-gray-400">/</span>
                  <span className="text-2xl font-bold text-pink-700">{loading ? '-' : totalP}</span>
                </div>
                <p className="text-xs text-gray-500">L / P</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs border-t pt-2">
              <div><span className="text-gray-500">Guru: </span><span className="font-semibold text-blue-700">{loading ? '-' : totalTeachersL}</span><span className="text-gray-400">/</span><span className="font-semibold text-pink-700">{loading ? '-' : totalTeachersP}</span></div>
              <div><span className="text-gray-500">Tendik: </span><span className="font-semibold text-blue-700">{loading ? '-' : totalStaffL}</span><span className="text-gray-400">/</span><span className="font-semibold text-pink-700">{loading ? '-' : totalStaffP}</span></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><BadgeCheck className="w-5 h-5 text-amber-700" /></div>
            <div><p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalCertified}</p><p className="text-xs text-gray-500">Sudah Sertifikasi</p></div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari nama pegawai..." value={pegawaiSearch} onChange={e => setPegawaiSearch(e.target.value)} className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48" />
        </div>
      </div>
      {!pegawaiSearch && (
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-[#0d3b66]">Daftar GTK per Sekolah</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
          ) : filteredData.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-400">Tidak ada data</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left group">
                  <th rowSpan={2} className="px-5 py-3 font-semibold text-gray-600 w-10 text-center">No</th>
                  <th rowSpan={2} onClick={() => toggle('name')} className="px-5 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    <span className="inline-flex items-center gap-1">Sekolah / Unit{sortKey === 'name' ? (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30" />}</span>
                  </th>
                  <th rowSpan={2} onClick={() => toggle('npsn')} className="px-5 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    <span className="inline-flex items-center gap-1">NPSN{sortKey === 'npsn' ? (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30" />}</span>
                  </th>
                  <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Guru</th>
                  <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Tendik</th>
                  <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Total</th>
                  <th rowSpan={2} onClick={() => toggle('headmaster')} className="px-5 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100 transition-colors">
                    <span className="inline-flex items-center gap-1">Kepala Sekolah{sortKey === 'headmaster' ? (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30" />}</span>
                  </th>
                </tr>
                <tr className="bg-gray-50">
                  <SortableHeader label="L" sortKey="teachers_l" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center text-xs px-3 py-2" />
                  <SortableHeader label="P" sortKey="teachers_p" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center text-xs px-3 py-2" />
                  <SortableHeader label="L" sortKey="staff_l" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center text-xs px-3 py-2" />
                  <SortableHeader label="P" sortKey="staff_p" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center text-xs px-3 py-2" />
                  <SortableHeader label="L" sortKey="l" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center text-xs px-3 py-2" />
                  <SortableHeader label="P" sortKey="p" currentKey={sortKey} direction={sortDir} onToggle={toggle} className="text-center text-xs px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((item, i) => (
                  <tr key={item.name} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-5 py-3 text-gray-500 text-center">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-[#0d3b66]">
                      <button onClick={() => handleSchoolClick(item.name)} className="text-left hover:text-blue-700 hover:underline transition-colors flex items-center gap-1">
                        {item.name}<ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
                      </button>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs font-mono">{item.npsn || '-'}</td>
                    <td className="px-5 py-3 text-center font-semibold text-blue-700">{(item.teachers_l || 0)}</td>
                    <td className="px-5 py-3 text-center font-semibold text-pink-700">{(item.teachers_p || 0)}</td>
                    <td className="px-5 py-3 text-center font-semibold text-blue-700">{(item.staff_l || 0)}</td>
                    <td className="px-5 py-3 text-center font-semibold text-pink-700">{(item.staff_p || 0)}</td>
                    <td className="px-5 py-3 text-center font-semibold text-blue-700">{(item.teachers_l || 0) + (item.staff_l || 0)}</td>
                    <td className="px-5 py-3 text-center font-semibold text-pink-700">{(item.teachers_p || 0) + (item.staff_p || 0)}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{item.headmaster || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}
      {pegawaiSearch && (
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b"><h3 className="font-semibold text-[#0d3b66]">Hasil Pencarian: &ldquo;{pegawaiSearch}&rdquo;</h3></div>
        <div className="overflow-x-auto">
          {!allPegawai ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : pegawaiSearch.length < 2 ? (
            <div className="px-5 py-8 text-center text-gray-400">Ketik minimal 2 huruf</div>
          ) : (
            (() => {
              const q = pegawaiSearch.toLowerCase();
              const matched = allPegawai.filter(p => p.nama?.toLowerCase().includes(q)).slice(0, 100);
              return matched.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400">Tidak ditemukan</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-5 py-3 font-semibold text-gray-600 text-center w-10">No</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Sekolah</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Jenis PTK</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">JK</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {matched.map((p, i) => (
                      <tr key={`${p.nama}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-5 py-2.5 text-gray-500 text-center">{i + 1}</td>
                        <td className="px-5 py-2.5 font-medium text-gray-900">{p.nama}{p.jenis_ptk === 'Kepala Sekolah' && <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-800">KEPSEK</span>}</td>
                        <td className="px-5 py-2.5 text-gray-500">{p.sekolah}</td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${p.jenis_ptk === 'Guru' ? 'bg-blue-100 text-blue-700' : p.jenis_ptk === 'Kepala Sekolah' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-700'}`}>{p.jenis_ptk}</span>
                        </td>
                        <td className="px-5 py-2.5 text-gray-500 text-center">{p.jk || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()
          )}
        </div>
        {allPegawai && pegawaiSearch.length >= 2 && (
          <div className="px-5 py-3 border-t text-xs text-gray-400">
            Menampilkan {allPegawai.filter(p => p.nama?.toLowerCase().includes(pegawaiSearch.toLowerCase())).length > 100 ? '100+' : allPegawai.filter(p => p.nama?.toLowerCase().includes(pegawaiSearch.toLowerCase())).length} dari {allPegawai.filter(p => p.nama?.toLowerCase().includes(pegawaiSearch.toLowerCase())).length} hasil
          </div>
        )}
      </div>
      )}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-10 px-2 sm:px-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedSchool(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <div><h3 className="font-semibold text-[#0d3b66] text-base">{selectedSchool}</h3><p className="text-xs text-gray-500 mt-0.5">Daftar Pegawai</p></div>
              <button onClick={() => setSelectedSchool(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              {pegawaiLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
              ) : pegawaiList.length === 0 ? (
                <div className="px-5 py-12 text-center text-gray-400">Tidak ada data pegawai</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0"><tr>
                    <th className="px-5 py-3 font-semibold text-gray-600 text-center w-10">No</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">Jenis PTK</th>
                    <th className="px-5 py-3 font-semibold text-gray-600">JK</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {pegawaiList.map((p, i) => (
                      <tr key={`${p.nama}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-5 py-2.5 text-gray-500 text-center">{i + 1}</td>
                        <td className="px-5 py-2.5 font-medium text-gray-900">{p.nama}{p.jenis_ptk === 'Kepala Sekolah' ? <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-800">KEPSEK</span> : ''}</td>
                        <td className="px-5 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${p.jenis_ptk === 'Guru' ? 'bg-blue-100 text-blue-700' : p.jenis_ptk === 'Kepala Sekolah' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-700'}`}>{p.jenis_ptk}</span>
                        </td>
                        <td className="px-5 py-2.5 text-gray-500 text-center">{p.jk || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-5 py-3 border-t text-xs text-gray-400 shrink-0">Total: {pegawaiList.length} pegawai</div>
          </div>
        </div>
      )}
    </>
  );
}

function TabPD() {
  const { schools } = useSekolah();
  const [search, setSearch] = useState('');
  const [siswaSearch, setSiswaSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  const [sekolahData, setSekolahData] = useState<SekolahKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [allSiswa, setAllSiswa] = useState<any[] | null>(null);
  const schoolsRef = useRef(schools);

  useEffect(() => { schoolsRef.current = schools; }, [schools]);

  const refreshInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const currentSchools = schoolsRef.current;
    async function load() {
      try {
        const [pdRes, siswaRes] = await Promise.all([
          fetch('/api/siswa/per-kelas'),
          fetch('/api/siswa/list?limit=10000'),
        ]);
        const json = await pdRes.json();
        if (json.data) {
          setSekolahData(buildSekolahData(currentSchools, json.data as SekolahKelas[]));
        } else {
          setSekolahData(buildSekolahData(currentSchools));
        }
        if (siswaRes.ok) {
          const sJson = await siswaRes.json();
          setAllSiswa(sJson.siswa || []);
        }
      } catch (e) {
        console.error('Gagal memuat data PD:', e);
        setSekolahData(buildSekolahData(currentSchools));
      } finally {
        setLoading(false);
      }
    }
    load();

    refreshInterval.current = setInterval(() => {
      const s = schoolsRef.current;
      fetch('/api/siswa/per-kelas')
        .then(r => r.ok ? r.json() : null)
        .then(json => { if (json?.data) setSekolahData(buildSekolahData(s, json.data as SekolahKelas[])); })
        .catch(() => {});
    }, 30000);

    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, []);

  const totalSekolah = sekolahData.length;
  const totalSiswa = sekolahData.reduce((a, s) => a + s.totalL + s.totalP, 0);
  const totalL = sekolahData.reduce((a, s) => a + s.totalL, 0);
  const totalP = sekolahData.reduce((a, s) => a + s.totalP, 0);

  const filtered = sekolahData.filter((item) => {
    if (filterJenjang !== 'ALL' && item.jenjang !== filterJenjang) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-[#0d3b66]">Data Peserta Didik</h2>
        <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><School className="w-5 h-5 text-blue-700" /></div><div><p className="text-2xl font-bold text-[#0d3b66]">{totalSekolah}</p><p className="text-xs text-gray-500">Sekolah</p></div></div>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-700" /></div><div><p className="text-2xl font-bold text-[#0d3b66]">{totalSiswa}</p><p className="text-xs text-gray-500">Total Siswa</p></div></div>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-sky-700" /></div><div><p className="text-2xl font-bold text-[#0d3b66]">{totalL}</p><p className="text-xs text-gray-500">Laki-laki</p></div></div>
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-rose-700" /></div><div><p className="text-2xl font-bold text-[#0d3b66]">{totalP}</p><p className="text-xs text-gray-500">Perempuan</p></div></div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {jenjangList.map((j) => {
              const meta = jenjangMeta[j];
              const Icon = meta.icon;
              const count = sekolahData.filter((s) => s.jenjang === j).length;
              const siswa = sekolahData.filter((s) => s.jenjang === j).reduce((a, s) => a + s.totalL + s.totalP, 0);
              return (
                <button key={j} onClick={() => setFilterJenjang(filterJenjang === j ? 'ALL' : j)}
                  className={`rounded-xl border p-4 text-left transition-all ${filterJenjang === j ? 'ring-2 ring-[#0d3b66] bg-white shadow-md' : 'bg-white shadow-sm hover:shadow'}`}>
                  <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-gray-500" /><span className="text-sm font-bold text-[#0d3b66]">{j}</span></div>
                  <p className="text-lg font-bold text-[#0d3b66]">{count}</p>
                  <p className="text-[11px] text-gray-500">{siswa} siswa</p>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari sekolah..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari nama siswa..." value={siswaSearch} onChange={(e) => setSiswaSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>
          {!siswaSearch && (
          <>
          {(filterJenjang === 'ALL' ? jenjangList : [filterJenjang]).map((j) => {
            const meta = jenjangMeta[j];
            const Icon = meta.icon;
            const semua = filtered.filter((s) => s.jenjang === j);
            if (semua.length === 0) return null;
            const groups = [{ label: meta.label, items: semua }];
            return groups.map((group, gi) => {
              const items = group.items;
              const kelasColumns = j === 'SD' ? sdKelas : j === 'TK' ? tkKelas : Array.from(new Set(items.flatMap((s) => Object.keys(s.perKelas)))).sort();
              return (
                <div key={`${j}-${gi}`} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50/50">
                    <Icon className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-[#0d3b66]">{group.label}</h3>
                    <span className="ml-auto text-xs text-gray-500">{items.length} sekolah</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left whitespace-nowrap">
                          <th rowSpan={2} className="px-3 py-2 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">No</th>
                          <th rowSpan={2} className="px-3 py-2 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">Nama Sekolah</th>
                          {kelasColumns.map((k) => (
                            <th key={k} colSpan={2} className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[96px] border-b border-gray-200">Kelas {k}</th>
                          ))}
                          <th colSpan={3} className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[160px] border-b border-gray-200">Total</th>
                        </tr>
                        <tr className="bg-gray-50 text-left whitespace-nowrap">
                          {kelasColumns.flatMap((k) => [
                            <th key={`${k}-l`} className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[48px]">L</th>,
                            <th key={`${k}-p`} className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[48px]">P</th>,
                          ])}
                          <th className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[60px]">L</th>
                          <th className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[60px]">P</th>
                          <th className="px-3 py-2 font-semibold text-gray-600 text-center min-w-[60px]">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {items.map((item, i) => (
                          <tr key={item.name} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-3 py-3 text-gray-500 sticky left-0 bg-white">{i + 1}</td>
                            <td className="px-3 py-3 font-medium text-[#0d3b66] sticky left-0 bg-white">{item.name}</td>
                            {kelasColumns.flatMap((k) => {
                              const d = item.perKelas[k];
                              return [
                                <td key={`${k}-l`} className="px-3 py-3 text-center text-gray-600">{d?.l ?? 0}</td>,
                                <td key={`${k}-p`} className="px-3 py-3 text-center text-gray-600">{d?.p ?? 0}</td>,
                              ];
                            })}
                            <td className="px-3 py-3 text-center font-semibold text-sky-700">{item.totalL}</td>
                            <td className="px-3 py-3 text-center font-semibold text-rose-700">{item.totalP}</td>
                            <td className="px-3 py-3 text-center font-semibold text-[#0d3b66]">{item.totalL + item.totalP}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100/80 text-sm font-semibold">
                        <tr>
                          <td className="px-3 py-3 sticky left-0 bg-gray-100/80" />
                          <td className="px-3 py-3 text-[#0d3b66] sticky left-0 bg-gray-100/80">Jumlah</td>
                          {kelasColumns.flatMap((k) => {
                            const sumL = items.reduce((a, s) => a + (s.perKelas[k]?.l ?? 0), 0);
                            const sumP = items.reduce((a, s) => a + (s.perKelas[k]?.p ?? 0), 0);
                            return [
                              <td key={`${k}-l`} className="px-3 py-3 text-center text-sky-700">{sumL}</td>,
                              <td key={`${k}-p`} className="px-3 py-3 text-center text-rose-700">{sumP}</td>,
                            ];
                          })}
                          <td className="px-3 py-3 text-center text-sky-700">{items.reduce((a, s) => a + s.totalL, 0)}</td>
                          <td className="px-3 py-3 text-center text-rose-700">{items.reduce((a, s) => a + s.totalP, 0)}</td>
                          <td className="px-3 py-3 text-center text-[#0d3b66]">{items.reduce((a, s) => a + s.totalL + s.totalP, 0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            });
          })}
          </>)}
          {siswaSearch && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b"><h3 className="font-semibold text-[#0d3b66]">Hasil Pencarian: &ldquo;{siswaSearch}&rdquo;</h3></div>
              <div className="overflow-x-auto">
                {!allSiswa ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                ) : siswaSearch.length < 2 ? (
                  <div className="px-5 py-8 text-center text-gray-400">Ketik minimal 2 huruf</div>
                ) : (
                  (() => {
                    const q = siswaSearch.toLowerCase();
                    const matched = allSiswa.filter((p: any) => p.nama?.toLowerCase().includes(q)).slice(0, 100);
                    return matched.length === 0 ? (
                      <div className="px-5 py-8 text-center text-gray-400">Tidak ditemukan</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                          <th className="px-5 py-3 font-semibold text-gray-600 text-center w-10">No</th>
                          <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                          <th className="px-5 py-3 font-semibold text-gray-600">Sekolah</th>
                          <th className="px-5 py-3 font-semibold text-gray-600">Kelas</th>
                          <th className="px-5 py-3 font-semibold text-gray-600">JK</th>
                        </tr></thead>
                        <tbody className="divide-y">
                          {matched.map((p: any, i: number) => (
                            <tr key={`${p.nama}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                              <td className="px-5 py-2.5 text-gray-500 text-center">{i + 1}</td>
                              <td className="px-5 py-2.5 font-medium text-gray-900">{p.nama}</td>
                              <td className="px-5 py-2.5 text-gray-500">{p.sekolah}</td>
                              <td className="px-5 py-2.5 text-gray-500">{p.kelas || (p.jenjang === 'TK' ? (p.rombel || '-') : '-')}</td>
                              <td className="px-5 py-2.5 text-gray-500 text-center">{p.jk || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()
                )}
              </div>
              {allSiswa && siswaSearch.length >= 2 && (
                <div className="px-5 py-3 border-t text-xs text-gray-400">
                  Menampilkan {Math.min(100, allSiswa.filter((p: any) => p.nama?.toLowerCase().includes(siswaSearch.toLowerCase())).length)} dari {allSiswa.filter((p: any) => p.nama?.toLowerCase().includes(siswaSearch.toLowerCase())).length} hasil
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

function TabRombel() {
  const [data, setData] = useState<RombelEntry[]>(rombelData);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const refreshInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/siswa/list');
        if (!res.ok) { console.error('Gagal fetch siswa:', res.status, res.statusText); setLoading(false); return; }
        const json = await res.json();
        if (json.siswa && json.siswa.length > 0) {
          const aggregated = aggregateRombel(json.siswa);
          if (aggregated.length > 0) setData(aggregated);
        }
      } catch (e) { console.error('Gagal memuat data rombel:', e); } finally { setLoading(false); }
    }
    loadData();
    refreshInterval.current = setInterval(() => {
      fetch('/api/siswa/list')
        .then(r => r.ok ? r.json() : null)
        .then(json => { if (json?.siswa?.length > 0) { const aggregated = aggregateRombel(json.siswa); if (aggregated.length > 0) setData(aggregated); } })
        .catch(() => {});
    }, 30000);
    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, []);

  const filtered = data.filter((item) => {
    if (filterJenjang !== 'ALL' && item.jenjang !== filterJenjang) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalSekolah = data.length;
  const totalRombel = data.reduce((a, s) => a + s.rombels, 0);
  const totalSiswa = data.reduce((a, s) => a + s.total, 0);

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-[#0d3b66]">Data Rombongan Belajar</h2>
        <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><School className="w-5 h-5 text-blue-700" /></div><div><p className="text-2xl font-bold text-[#0d3b66]">{totalSekolah}</p><p className="text-xs text-gray-500">Total Sekolah</p></div></div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="w-5 h-5 text-purple-700" /></div><div><p className="text-2xl font-bold text-[#0d3b66]">{totalRombel}</p><p className="text-xs text-gray-500">Total Rombel</p></div></div>
        </div>
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Users className="w-5 h-5 text-emerald-700" /></div><div><p className="text-2xl font-bold text-[#0d3b66]">{totalSiswa}</p><p className="text-xs text-gray-500">Total Siswa</p></div></div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {jenjangList.map((j) => {
          const meta = jenjangMeta[j];
          const Icon = meta.icon;
          const items = data.filter((s) => s.jenjang === j);
          const rombelCount = items.reduce((a, s) => a + s.rombels, 0);
          const siswaCount = items.reduce((a, s) => a + s.total, 0);
          return (
            <button key={j} onClick={() => setFilterJenjang(filterJenjang === j ? 'ALL' : j)}
              className={`rounded-xl border p-4 text-left transition-all ${filterJenjang === j ? 'ring-2 ring-[#0d3b66] bg-white shadow-md' : 'bg-white shadow-sm hover:shadow'}`}>
              <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-gray-500" /><span className="text-sm font-bold text-[#0d3b66]">{j}</span></div>
              <p className="text-lg font-bold text-[#0d3b66]">{items.length}</p>
              <p className="text-[11px] text-gray-500">{rombelCount} rombel, {siswaCount} siswa</p>
            </button>
          );
        })}
      </div>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-2">
          <h3 className="font-semibold text-[#0d3b66]">Daftar Rombel per Sekolah</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari sekolah..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 font-semibold text-gray-600 w-8" />
                <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                <th className="px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Jenjang</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Nama Sekolah</th>
                <th className="px-5 py-3 font-semibold text-gray-600 text-center">Jml Rombel</th>
                <th className="px-5 py-3 font-semibold text-gray-600 text-center">Total Siswa</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(() => {
                if (loading) return <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Memuat data...</td></tr>;
                if (filtered.length === 0) return <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Tidak ada data</td></tr>;
                return filtered.map((item, i) => (
                  <Fragment key={item.name}>
                    <tr className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => toggleExpand(item.name)}>
                      <td className="px-5 py-3 text-gray-400">{expanded.has(item.name) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                      <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${item.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' : item.jenjang === 'TK' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>{item.jenjang}</span>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#0d3b66]">{item.name}</td>
                      <td className="px-5 py-3 text-center font-semibold">{item.rombels}</td>
                      <td className="px-5 py-3 text-center font-semibold">{item.total}</td>
                    </tr>
                    {expanded.has(item.name) && (
                      <tr>
                        <td colSpan={6} className="px-0 py-0">
                          <table className="w-full text-xs bg-gray-50/80">
                            <thead><tr className="text-gray-500 border-t">
                              <th className="pl-14 pr-4 py-2 font-medium text-left">Nama Rombel</th>
                              <th className="px-4 py-2 font-medium text-center">L</th>
                              <th className="px-4 py-2 font-medium text-center">P</th>
                              <th className="px-4 py-2 font-medium text-center">Total</th>
                            </tr></thead>
                            <tbody>
                              {item.details.map((d) => (
                                <tr key={d.name} className="border-t border-gray-200/50">
                                  <td className="pl-14 pr-4 py-2 font-medium text-[#0d3b66]">{d.name}</td>
                                  <td className="px-4 py-2 text-center text-gray-600">{d.l}</td>
                                  <td className="px-4 py-2 text-center text-gray-600">{d.p}</td>
                                  <td className="px-4 py-2 text-center font-semibold">{d.total}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t text-xs text-gray-500">
          {loading ? 'Memuat data...' : `Menampilkan ${filtered.length} dari ${data.length} sekolah`}
        </div>
      </div>
    </>
  );
}

function TabDapodik() {
  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-[#0d3b66]">Dapodik</h2>
        <p className="text-sm text-gray-500 mt-1">Data Pokok Pendidikan - Kecamatan Lemahabang</p>
      </div>
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
          <ExternalLink className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-[#0d3b66] text-lg">Buka Dapodik</p>
          <p className="text-sm text-gray-600 mt-1">
            Halaman ini akan dibuka di tab baru karena situs tujuan tidak dapat ditampilkan dalam halaman ini.
          </p>
        </div>
        <a
          href="https://dapo.kemendikdasmen.go.id/progres/3/021706"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          Buka Dapodik
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
