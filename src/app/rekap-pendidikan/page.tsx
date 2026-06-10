'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Loader2, School, Users, BookOpen, ClipboardList, MapPin } from 'lucide-react';

export default function RekapPendidikanPublicPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/firestore/schools').then(r => r.json()),
      fetch('/api/firestore/students?limit=10000').then(r => r.json()),
      fetch('/api/firestore/employees').then(r => r.json()),
      fetch('/api/firestore/employee_mappings').then(r => r.json()),
      fetch('/api/firestore/sirubin_reports').then(r => r.json()),
    ])
      .then(([s, st, e, m, r]) => {
        if (s.items) setSchools(s.items);
        if (st.items) setStudents(st.items);
        if (e.items) setEmployees(e.items);
        if (m.items) setMappings(m.items);
        if (r.items) setReports(r.items);
      })
      .catch(() => setError('Gagal memuat data rekap'))
      .finally(() => setLoading(false));
  }, []);

  const rekap = useMemo(() => {
    const sdNegeri = schools.filter(s => s.jenjang === 'SD' && s.statusSekolah === 'Negeri').length;
    const sdSwasta = schools.filter(s => s.jenjang === 'SD' && s.statusSekolah === 'Swasta').length;
    const tkNegeri = schools.filter(s => s.jenjang === 'TK' && s.statusSekolah === 'Negeri').length;
    const tkSwasta = schools.filter(s => s.jenjang === 'TK' && s.statusSekolah === 'Swasta').length;
    const kbNegeri = schools.filter(s => s.jenjang === 'KB' && s.statusSekolah === 'Negeri').length;
    const kbSwasta = schools.filter(s => s.jenjang === 'KB' && s.statusSekolah === 'Swasta').length;

    const siswaL = students.filter(s => s.jenisKelamin === 'L' || s.jenisKelamin === 'Laki-laki').length;
    const siswaP = students.filter(s => s.jenisKelamin === 'P' || s.jenisKelamin === 'Perempuan').length;

    const pns = employees.filter(e => e.statusPegawai === 'PNS').length;
    const pppk = employees.filter(e => e.statusPegawai === 'PPPK').length;
    const honorer = employees.filter(e => ['Honorer','GTT','GTY'].includes(e.statusPegawai)).length;

    const kurang = mappings.filter(m => (m.totalPegawaiTersedia || 0) - (m.totalKebutuhanIdeal || 0) < 0).length;
    const lebih = mappings.filter(m => (m.totalPegawaiTersedia || 0) - (m.totalKebutuhanIdeal || 0) > 0).length;

    const laporanMasuk = reports.filter(r => r.statusLaporan === 'Terkirim' || r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci').length;
    const laporanBelum = reports.filter(r => r.statusLaporan === 'Belum Dibuat' || r.statusLaporan === 'Draft').length;

    return {
      sdNegeri, sdSwasta, tkNegeri, tkSwasta, kbNegeri, kbSwasta,
      totalSiswa: students.length, siswaL, siswaP,
      totalPegawai: employees.length,
      totalGuru: employees.filter(e => e.jabatan?.toLowerCase().includes('guru') || e.jabatan?.toLowerCase().includes('pendidik')).length,
      totalTendik: employees.filter(e => e.jabatan === 'Tendik').length,
      totalKepsek: employees.filter(e => e.jabatan?.toLowerCase().includes('kepala')).length,
      pns, pppk, honorer,
      kurang, lebih,
      laporanMasuk, laporanBelum,
    };
  }, [schools, students, employees, mappings, reports]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Memuat data rekap...</span></div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-red-600">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-blue-200" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Rekap Pendidikan</h1>
          </div>
          <p className="text-sm text-blue-200">Rekap gabungan data pendidikan Kecamatan Lemahabang</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-xl border p-4 text-center"><School className="w-5 h-5 text-blue-600 mx-auto mb-1" /><p className="text-xl font-bold">{rekap.sdNegeri + rekap.sdSwasta}</p><p className="text-[10px] text-muted-foreground">SD ({rekap.sdNegeri}N/{rekap.sdSwasta}S)</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><School className="w-5 h-5 text-purple-600 mx-auto mb-1" /><p className="text-xl font-bold">{rekap.tkNegeri + rekap.tkSwasta}</p><p className="text-[10px] text-muted-foreground">TK ({rekap.tkNegeri}N/{rekap.tkSwasta}S)</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><School className="w-5 h-5 text-green-600 mx-auto mb-1" /><p className="text-xl font-bold">{rekap.kbNegeri + rekap.kbSwasta}</p><p className="text-[10px] text-muted-foreground">KB ({rekap.kbNegeri}N/{rekap.kbSwasta}S)</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><Users className="w-5 h-5 text-violet-600 mx-auto mb-1" /><p className="text-xl font-bold">{rekap.totalSiswa}</p><p className="text-[10px] text-muted-foreground">Siswa ({rekap.siswaL}L/{rekap.siswaP}P)</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><BookOpen className="w-5 h-5 text-amber-600 mx-auto mb-1" /><p className="text-xl font-bold">{rekap.totalPegawai}</p><p className="text-[10px] text-muted-foreground">Pegawai ({rekap.pns}PNS/{rekap.pppk}PPPK)</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><ClipboardList className="w-5 h-5 text-cyan-600 mx-auto mb-1" /><p className="text-xl font-bold">{rekap.laporanMasuk}</p><p className="text-[10px] text-muted-foreground">Laporan Masuk</p></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
            <h3 className="font-semibold text-sm mb-3">Sekolah</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>SD Negeri</span><span className="font-bold">{rekap.sdNegeri}</span></div>
              <div className="flex justify-between"><span>SD Swasta</span><span className="font-bold">{rekap.sdSwasta}</span></div>
              <div className="flex justify-between"><span>TK Negeri</span><span className="font-bold">{rekap.tkNegeri}</span></div>
              <div className="flex justify-between"><span>TK Swasta</span><span className="font-bold">{rekap.tkSwasta}</span></div>
              <div className="flex justify-between"><span>KB Negeri</span><span className="font-bold">{rekap.kbNegeri}</span></div>
              <div className="flex justify-between"><span>KB Swasta</span><span className="font-bold">{rekap.kbSwasta}</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
            <h3 className="font-semibold text-sm mb-3">Pegawai</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total Pegawai</span><span className="font-bold">{rekap.totalPegawai}</span></div>
              <div className="flex justify-between"><span>Guru/Pendidik</span><span className="font-bold">{rekap.totalGuru}</span></div>
              <div className="flex justify-between"><span>Tendik</span><span className="font-bold">{rekap.totalTendik}</span></div>
              <div className="flex justify-between"><span>Kepala Sekolah</span><span className="font-bold">{rekap.totalKepsek}</span></div>
              <div className="flex justify-between"><span>PNS</span><span className="font-bold">{rekap.pns}</span></div>
              <div className="flex justify-between"><span>PPPK</span><span className="font-bold">{rekap.pppk}</span></div>
              <div className="flex justify-between"><span>Honorer</span><span className="font-bold">{rekap.honorer}</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
            <h3 className="font-semibold text-sm mb-3">Siswa</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total Siswa</span><span className="font-bold">{rekap.totalSiswa}</span></div>
              <div className="flex justify-between"><span>Laki-laki</span><span className="font-bold">{rekap.siswaL}</span></div>
              <div className="flex justify-between"><span>Perempuan</span><span className="font-bold">{rekap.siswaP}</span></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
            <h3 className="font-semibold text-sm mb-3">Lainnya</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Sekolah Kurang</span><span className="font-bold text-red-600">{rekap.kurang}</span></div>
              <div className="flex justify-between"><span>Sekolah Lebih</span><span className="font-bold text-amber-600">{rekap.lebih}</span></div>
              <div className="flex justify-between"><span>Laporan Masuk</span><span className="font-bold text-green-600">{rekap.laporanMasuk}</span></div>
              <div className="flex justify-between"><span>Laporan Belum</span><span className="font-bold text-gray-600">{rekap.laporanBelum}</span></div>
              <div className="flex justify-between"><span>Progres</span><span className="font-bold">{rekap.laporanMasuk + rekap.laporanBelum > 0 ? Math.round((rekap.laporanMasuk / (rekap.laporanMasuk + rekap.laporanBelum)) * 100) : 0}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
