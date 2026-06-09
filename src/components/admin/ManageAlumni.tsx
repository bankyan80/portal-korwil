'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { AdminEmptyState } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import {
  School, Users, Search, Loader2, ArrowUp, BookOpen, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface AlumniRecord {
  nik: string;
  nama: string;
  jk: string;
  nisn: string;
  sekolah: string;
  jenjang: string;
  kelas?: number | string;
  desa: string;
  status?: string;
  alasan?: string;
}

export function ManageAlumni() {
  const { user } = useAppStore();
  const [allAlumni, setAllAlumni] = useState<AlumniRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [promoting, setPromoting] = useState(false);

  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';

  useEffect(() => {
    async function load() {
      if (!isOperator) { setLoading(false); return; }

      let dbSiswa: any[] = [];
      try {
        const apiUrl = user?.schoolId
          ? `/api/siswa/list?schoolId=${user.schoolId}&sekolah=${encodeURIComponent(userSchool)}`
          : `/api/siswa/list?sekolah=${encodeURIComponent(userSchool)}`;
        const res = await fetch(apiUrl);
        const json = await res.json();
        dbSiswa = (json.siswa || []);
      } catch (e) { console.error('Error fetching siswa API:', e); }

      let overlayRecords: any[] = [];
      try {
        const res = await fetch('/api/siswa/manage');
        const json = await res.json();
        overlayRecords = (json.records || []);
      } catch (e) { console.error('Error fetching overlay:', e); }

      const overlayByNik = new Map(overlayRecords.map((r: any) => [r.nik, r]));
      const merged = dbSiswa.map((s: any) => {
        const ov = overlayByNik.get(s.nik);
        return ov ? { ...s, ...ov } : s;
      });
      for (const ov of overlayRecords) {
        if (!merged.some((m: any) => m.nik === ov.nik)) {
          merged.push(ov);
        }
      }

      const alumni = merged.filter((s: any) => s.status === 'lulus');
      setAllAlumni(alumni);
      setLoading(false);
    }
    load();
  }, [isOperator, userSchool, user?.schoolId]);

  const total = allAlumni.length;
  const totalL = allAlumni.filter(s => s.jk === 'L').length;
  const totalP = allAlumni.filter(s => s.jk === 'P').length;

  const groupedByTahun = useMemo(() => {
    const groups: { label: string; key: string; alumni: AlumniRecord[] }[] = [];
    const byYear: Record<string, AlumniRecord[]> = {};
    for (const s of allAlumni) {
      const year = s.alasan?.match(/\d{4}/)?.[0] || 'Tidak diketahui';
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(s);
    }
    for (const year of Object.keys(byYear).sort((a, b) => (b === 'Tidak diketahui' ? -1 : Number(b) - Number(a)))) {
      groups.push({ label: `Lulus ${year}`, key: year, alumni: byYear[year] });
    }
    return groups;
  }, [allAlumni]);

  async function handlePromote() {
    setPromoting(true);
    try {
      const res = await fetch('/api/siswa/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promote' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${json.promoted} siswa SD berhasil naik kelas`);
        window.location.reload();
      } else {
        toast.error(json.error || 'Gagal menaikkan kelas');
      }
    } catch (e) { console.error('Error promoting classes:', e); toast.error('Gagal menaikkan kelas'); } finally { setPromoting(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (!isOperator) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Halaman alumni hanya tersedia untuk operator sekolah.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-yellow-700 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
              <p className="text-xs text-muted-foreground">Total Alumni</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-sky-700 dark:text-sky-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalL}</p>
              <p className="text-xs text-muted-foreground">Laki-laki</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-rose-700 dark:text-rose-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalP}</p>
              <p className="text-xs text-muted-foreground">Perempuan</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-lg px-3 py-2">
        Data alumni untuk: <strong>{userSchool}</strong>
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari NIK/nama..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full bg-background text-foreground" />
        </div>
        <Button onClick={handlePromote} disabled={promoting} variant="outline" className="gap-2">
          {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
          Naik Kelas
        </Button>
      </div>

      {allAlumni.length === 0 ? (
        <AdminEmptyState icon={School} title="Belum ada data alumni"
          description="Siswa yang naik kelas 6 akan otomatis masuk ke alumni setelah promosi kenaikan kelas" />
      ) : (
        <div className="space-y-6">
          {groupedByTahun.map(group => {
            const filtered = search
              ? group.alumni.filter(s => s.nama.toLowerCase().includes(search.toLowerCase()) || s.nik.includes(search))
              : group.alumni;
            if (!filtered.length) return null;
            const l = filtered.filter(s => s.jk === 'L').length;
            const p = filtered.filter(s => s.jk === 'P').length;
            return (
              <div key={group.key} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                  <span className="text-xs text-muted-foreground">L: {l} &middot; P: {p} &middot; Total: {l + p}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground w-10">No</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">NIK</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">NISN</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Nama Alumni</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground w-12">JK</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-muted-foreground w-20">Jenjang</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground hidden md:table-cell">Desa</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map((s, i) => (
                        <tr key={s.nik} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.nik}</td>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{s.nisn || '-'}</td>
                          <td className="px-4 py-2 font-medium text-foreground whitespace-nowrap">{s.nama}</td>
                          <td className="px-4 py-2 text-center text-muted-foreground">{s.jk}</td>
                          <td className="px-4 py-2 text-center">
                            <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                              {s.jenjang || 'SD'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground hidden md:table-cell">{s.desa || '-'}</td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{s.alasan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
