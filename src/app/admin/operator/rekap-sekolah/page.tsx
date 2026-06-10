'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { BarChart3, Users, BookOpen, ClipboardList, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorRekapSekolah() {
  const { user } = useAppStore();
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.schoolId) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/firestore/students?field=schoolId&value=${user.schoolId}`).then(r => r.json()),
      fetch(`/api/firestore/employees?field=schoolId&value=${user.schoolId}`).then(r => r.json()),
      fetch(`/api/firestore/sirubin_reports?field=schoolId&value=${user.schoolId}`).then(r => r.json()),
    ])
      .then(([sJson, eJson, rJson]) => {
        setStudents(sJson.items || []);
        setEmployees(eJson.items || []);
        setReports(rJson.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.schoolId]);

  if (!user) return null;

  const siswaAktif = students.filter(s => s.statusSiswa === 'Aktif');
  const pegawaiAktif = employees.filter(e => e.statusAktif === 'Aktif');
  const laporanValid = reports.filter(r => r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci');

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Rekap Sekolah">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="p-6 max-w-7xl mx-auto space-y-4">
        <h1 className="text-lg font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Rekap {user.schoolName || 'Sekolah'}</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border p-4 text-center">
                <div className="flex justify-center mb-2"><Users className="w-6 h-6 text-blue-600" /></div>
                <p className="text-2xl font-bold">{siswaAktif.length}</p>
                <p className="text-xs text-muted-foreground">Siswa Aktif</p>
              </div>
              <div className="bg-white rounded-xl border p-4 text-center">
                <div className="flex justify-center mb-2"><BookOpen className="w-6 h-6 text-green-600" /></div>
                <p className="text-2xl font-bold">{pegawaiAktif.length}</p>
                <p className="text-xs text-muted-foreground">Pegawai Aktif</p>
              </div>
              <div className="bg-white rounded-xl border p-4 text-center">
                <div className="flex justify-center mb-2"><ClipboardList className="w-6 h-6 text-purple-600" /></div>
                <p className="text-2xl font-bold">{laporanValid.length}</p>
                <p className="text-xs text-muted-foreground">Laporan Valid</p>
              </div>
              <div className="bg-white rounded-xl border p-4 text-center">
                <div className="flex justify-center mb-2"><BarChart3 className="w-6 h-6 text-amber-600" /></div>
                <p className="text-2xl font-bold">{students.length ? Math.round((siswaAktif.length / students.length) * 100) : 0}%</p>
                <p className="text-xs text-muted-foreground">Siswa Aktif</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Siswa per Kelas</h3>
                {['1','2','3','4','5','6','A','B','KB'].map(k => {
                  const count = students.filter(s => s.kelas === k && s.statusSiswa === 'Aktif').length;
                  if (!count) return null;
                  return (
                    <div key={k} className="flex items-center justify-between text-sm py-1">
                      <span>Kelas {k}</span>
                      <span className="font-medium">{count} siswa</span>
                    </div>
                  );
                })}
              </div>
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Pegawai per Jabatan</h3>
                {['Kepala Sekolah','Guru Kelas','Guru PAI','Guru PJOK','Guru Mapel','Tendik','Operator'].map(j => {
                  const count = employees.filter(e => e.jabatan === j && e.statusAktif === 'Aktif').length;
                  if (!count) return null;
                  return (
                    <div key={j} className="flex items-center justify-between text-sm py-1">
                      <span>{j}</span>
                      <span className="font-medium">{count} pegawai</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
