'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Search, Users, BookOpen, BadgeCheck, Download, GraduationCap, Loader2, X, MapPin, Briefcase, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useSort } from '@/hooks/useSort';
import { SortableHeader } from '@/components/ui/SortableHeader';
import Footer from '@/components/portal/Footer';

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

export default function DataGTKPage() {
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a
              href="/"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Data GTK</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Data Guru dan Tenaga Kependidikan</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalGTK}</p>
                <p className="text-xs text-gray-500">Total GTK</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalTeachers}</p>
                <p className="text-xs text-gray-500">Guru</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalStaff}</p>
                <p className="text-xs text-gray-500">Tenaga Pendidik</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-cyan-700" />
                </div>
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
                <div>
                  <span className="text-gray-500">Guru: </span>
                  <span className="font-semibold text-blue-700">{loading ? '-' : totalTeachersL}</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-semibold text-pink-700">{loading ? '-' : totalTeachersP}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tendik: </span>
                  <span className="font-semibold text-blue-700">{loading ? '-' : totalStaffL}</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-semibold text-pink-700">{loading ? '-' : totalStaffP}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d3b66]">{loading ? '-' : totalCertified}</p>
                <p className="text-xs text-gray-500">Sudah Sertifikasi</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-[#0d3b66]">Daftar GTK per Sekolah</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama pegawai..."
                  value={pegawaiSearch}
                  onChange={e => setPegawaiSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400">Tidak ada data</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left group">
                    <th rowSpan={2} className="px-5 py-3 font-semibold text-gray-600 w-10 text-center">No</th>
                    <th rowSpan={2} onClick={() => toggle('name')} className="px-5 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="inline-flex items-center gap-1">
                        Sekolah / Unit
                        {sortKey === 'name' ? (
                          sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30" />
                        )}
                      </span>
                    </th>
                    <th rowSpan={2} onClick={() => toggle('npsn')} className="px-5 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="inline-flex items-center gap-1">
                        NPSN
                        {sortKey === 'npsn' ? (
                          sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30" />
                        )}
                      </span>
                    </th>
                    <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Guru</th>
                    <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Tendik</th>
                    <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Total</th>
                    <th rowSpan={2} onClick={() => toggle('headmaster')} className="px-5 py-3 font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="inline-flex items-center gap-1">
                        Kepala Sekolah
                        {sortKey === 'headmaster' ? (
                          sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-30" />
                        )}
                      </span>
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
                          {item.name}
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
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

        {pegawaiSearch && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-[#0d3b66]">Hasil Pencarian: "{pegawaiSearch}"</h3>
            </div>
            <div className="overflow-x-auto">
              {!allPegawai ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
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
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 font-semibold text-gray-600 text-center w-10">No</th>
                          <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                          <th className="px-5 py-3 font-semibold text-gray-600">Sekolah</th>
                          <th className="px-5 py-3 font-semibold text-gray-600">Jenis PTK</th>
                          <th className="px-5 py-3 font-semibold text-gray-600">JK</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {matched.map((p, i) => (
                          <tr key={`${p.nama}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-5 py-2.5 text-gray-500 text-center">{i + 1}</td>
                            <td className="px-5 py-2.5 font-medium text-gray-900">
                              {p.nama}
                              {p.jenis_ptk === 'Kepala Sekolah' && (
                                <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-800">KEPSEK</span>
                              )}
                            </td>
                            <td className="px-5 py-2.5 text-gray-500">{p.sekolah}</td>
                            <td className="px-5 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                p.jenis_ptk === 'Guru' ? 'bg-blue-100 text-blue-700' :
                                p.jenis_ptk === 'Kepala Sekolah' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-700'
                              }`}>{p.jenis_ptk}</span>
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
                <div>
                  <h3 className="font-semibold text-[#0d3b66] text-base">{selectedSchool}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Daftar Pegawai</p>
                </div>
                <button onClick={() => setSelectedSchool(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {pegawaiLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : pegawaiList.length === 0 ? (
                  <div className="px-5 py-12 text-center text-gray-400">Tidak ada data pegawai</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-5 py-3 font-semibold text-gray-600 text-center w-10">No</th>
                        <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                        <th className="px-5 py-3 font-semibold text-gray-600">Jenis PTK</th>
                        <th className="px-5 py-3 font-semibold text-gray-600">JK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pegawaiList.map((p, i) => (
                        <tr key={`${p.nama}-${i}`} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-5 py-2.5 text-gray-500 text-center">{i + 1}</td>
                          <td className="px-5 py-2.5 font-medium text-gray-900">{p.nama}{p.jenis_ptk === 'Kepala Sekolah' ? <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-800">KEPSEK</span> : ''}</td>
                          <td className="px-5 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              p.jenis_ptk === 'Guru' ? 'bg-blue-100 text-blue-700' :
                              p.jenis_ptk === 'Kepala Sekolah' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-purple-100 text-purple-700'
                            }`}>{p.jenis_ptk}</span>
                          </td>
                          <td className="px-5 py-2.5 text-gray-500 text-center">{p.jk || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="px-5 py-3 border-t text-xs text-gray-400 shrink-0">
                Total: {pegawaiList.length} pegawai
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-[#0d3b66] mb-2">Perhatian</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Data Guru dan Tenaga Kependidikan (GTK) di lingkungan Kecamatan Lemahabang,
            Kabupaten Cirebon. Jika ada perubahan data, silakan hubungi Operator Sekolah
            masing-masing untuk melakukan pembaruan data.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
