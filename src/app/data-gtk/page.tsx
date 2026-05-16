'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Users, BookOpen, BadgeCheck, Download, GraduationCap } from 'lucide-react';
import Footer from '@/components/portal/Footer';

interface SchoolGtk {
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

export default function DataGTKPage() {
  const [schoolData, setSchoolData] = useState<SchoolGtk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const response = await fetch('/api/pegawai/gtk-summary');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (isMounted) {
          setSchoolData(json.schools || []);
          console.log('GTK data loaded:', json.schools?.length || 0, 'schools');
        }
      } catch (error) {
        console.error('Error fetching GTK data:', error);
        if (isMounted) {
          setSchoolData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

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
    return item.name.toLowerCase().includes(search.toLowerCase());
  });

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
                <p className="text-2xl font-bold text-[#0d3b66]">{totalGTK}</p>
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
                <p className="text-2xl font-bold text-[#0d3b66]">{totalTeachers}</p>
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
                <p className="text-2xl font-bold text-[#0d3b66]">{totalStaff}</p>
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
                    <span className="text-2xl font-bold text-blue-700">{totalL}</span>
                    <span className="text-xs text-gray-400">/</span>
                    <span className="text-2xl font-bold text-pink-700">{totalP}</span>
                  </div>
                  <p className="text-xs text-gray-500">L / P</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs border-t pt-2">
                <div>
                  <span className="text-gray-500">Guru: </span>
                  <span className="font-semibold text-blue-700">{totalTeachersL}</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-semibold text-pink-700">{totalTeachersP}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tendik: </span>
                  <span className="font-semibold text-blue-700">{totalStaffL}</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-semibold text-pink-700">{totalStaffP}</span>
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
                <p className="text-2xl font-bold text-[#0d3b66]">{totalCertified}</p>
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
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th rowSpan={2} className="px-5 py-3 font-semibold text-gray-600 w-10 text-center">No</th>
                    <th rowSpan={2} className="px-5 py-3 font-semibold text-gray-600">Sekolah / Unit</th>
                    <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Guru</th>
                    <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Tendik</th>
                    <th colSpan={2} className="px-5 py-3 font-semibold text-gray-600 text-center border-b border-gray-200">Total</th>
                    <th rowSpan={2} className="px-5 py-3 font-semibold text-gray-600">Kepala Sekolah</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 font-semibold text-gray-500 text-center text-xs">L</th>
                    <th className="px-3 py-2 font-semibold text-gray-500 text-center text-xs">P</th>
                    <th className="px-3 py-2 font-semibold text-gray-500 text-center text-xs">L</th>
                    <th className="px-3 py-2 font-semibold text-gray-500 text-center text-xs">P</th>
                    <th className="px-3 py-2 font-semibold text-gray-500 text-center text-xs">L</th>
                    <th className="px-3 py-2 font-semibold text-gray-500 text-center text-xs">P</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={9} className="px-5 py-12 text-center text-gray-400">Tidak ada data</td></tr>
                  ) : filteredData.map((item, i) => (
                    <tr key={item.name} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-5 py-3 text-gray-500 text-center">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-[#0d3b66]">{item.name}</td>
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
