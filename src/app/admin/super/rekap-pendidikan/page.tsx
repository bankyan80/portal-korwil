'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { BarChart3, LogOut, ArrowLeft, Loader2, School, Users, BookOpen, ClipboardList } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { LoadingState } from '@/components/shared/LoadingState';

export default function SuperRekapPendidikan() {
  const { user } = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/firestore/schools').then(r => r.json()),
      fetch('/api/firestore/students?limit=10000').then(r => r.json()),
      fetch('/api/firestore/employees').then(r => r.json()),
      fetch('/api/firestore/sirubin_reports').then(r => r.json()),
    ])
      .then(([sJson, stJson, eJson, rJson]) => {
        setSchools(sJson.items || []);
        setStudents(stJson.items || []);
        setEmployees(eJson.items || []);
        setReports(rJson.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const sd = schools.filter(s => s.jenjang === 'SD');
  const tk = schools.filter(s => s.jenjang === 'TK');
  const kb = schools.filter(s => s.jenjang === 'KB');
  const negeri = schools.filter(s => s.statusSekolah === 'Negeri');
  const swasta = schools.filter(s => s.statusSekolah === 'Swasta');

  const siswaAktif = students.filter(s => s.statusSiswa === 'Aktif');
  const pegawaiAktif = employees.filter(e => e.statusAktif === 'Aktif');

  const siswaPerJenjang: Record<string, number> = {};
  const pegawaiPerJenjang: Record<string, number> = {};
  const pegawaiPerJabatan: Record<string, number> = {};

  for (const s of siswaAktif) {
    const j = s.jenjang || 'SD';
    siswaPerJenjang[j] = (siswaPerJenjang[j] || 0) + 1;
  }
  for (const e of pegawaiAktif) {
    const j = e.jenjang || 'SD';
    pegawaiPerJenjang[j] = (pegawaiPerJenjang[j] || 0) + 1;
    pegawaiPerJabatan[e.jabatan || 'Lainnya'] = (pegawaiPerJabatan[e.jabatan || 'Lainnya'] || 0) + 1;
  }

  const laporanBulanIni = reports.filter(r => r.bulan === new Date().getMonth() + 1 && r.tahun === new Date().getFullYear());
  const laporanValid = laporanBulanIni.filter(r => r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci');

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}><Icon className="w-6 h-6 text-white" /></div>
      <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
    </div>
  );

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Rekap Pendidikan">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Rekap Pendidikan</h1><p className="text-sm text-blue-200">{user.displayName}</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {loading ? <LoadingState /> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={School} label="Sekolah/Lembaga" value={schools.length} color="bg-blue-600" />
              <StatCard icon={Users} label="Siswa Aktif" value={siswaAktif.length} color="bg-green-600" />
              <StatCard icon={BookOpen} label="Pegawai Aktif" value={pegawaiAktif.length} color="bg-amber-600" />
              <StatCard icon={ClipboardList} label="Laporan Valid (Bln Ini)" value={laporanValid.length} color="bg-purple-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">Sekolah per Jenjang</h3>
                <div className="space-y-3">
                  {[{ label: 'SD', count: sd.length, pct: Math.round((sd.length / schools.length) * 100) },
                    { label: 'TK', count: tk.length, pct: Math.round((tk.length / schools.length) * 100) },
                    { label: 'KB', count: kb.length, pct: Math.round((kb.length / schools.length) * 100) },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-sm mb-1"><span className="font-medium">SD {s.label === 'SD' ? '' : s.label === 'TK' ? '' : ''}</span><span>{s.count} ({s.pct}%)</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${s.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Negeri:</span> <span className="font-medium">{negeri.length}</span></div>
                  <div><span className="text-muted-foreground">Swasta:</span> <span className="font-medium">{swasta.length}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">Siswa Aktif per Jenjang</h3>
                <div className="space-y-3">
                  {['SD', 'TK', 'KB'].map(j => {
                    const count = siswaPerJenjang[j] || 0;
                    const pct = siswaAktif.length ? Math.round((count / siswaAktif.length) * 100) : 0;
                    return (
                      <div key={j}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-medium">{j}</span><span>{count} ({pct}%)</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t text-sm"><span className="text-muted-foreground">Total:</span> <span className="font-medium">{siswaAktif.length}</span></div>
              </div>

              <div className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">Pegawai per Jabatan</h3>
                <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  {Object.entries(pegawaiPerJabatan)
                    .sort(([, a], [, b]) => b - a)
                    .map(([jab, count]) => (
                      <div key={jab} className="flex justify-between py-1 border-b border-dashed last:border-0">
                        <span>{jab}</span><span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-4 pt-3 border-t text-sm"><span className="text-muted-foreground">Total:</span> <span className="font-medium">{pegawaiAktif.length}</span></div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
