'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Loader2, FolderOpen, FileText, ChevronDown } from 'lucide-react';
import { apiGet, apiDelete } from '@/lib/api-firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import type { DokumenBersama } from '@/types';

export default function SuperAdminDokumenPage() {
  const [allDocs, setAllDocs] = useState<DokumenBersama[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    apiGet('dokumen', { orderBy: { field: 'uploadedAt', dir: 'desc' } }).then((res) => {
      setAllDocs(res?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const employeeMap = useMemo(() => {
    const map = new Map<string, {
      nik: string; nip: string; nama: string; sekolah: string; count: number; docs: DokumenBersama[];
    }>();
    for (const d of allDocs) {
      const key = d.nik || d.nip || d.nama || crypto.randomUUID();
      if (!key) continue;
      let e = map.get(key);
      if (!e) {
        e = { nik: d.nik, nip: d.nip, nama: d.nama, sekolah: d.sekolah || '', count: 0, docs: [] };
        map.set(key, e);
      }
      e.count++;
      e.docs.push(d);
    }
    return map;
  }, [allDocs]);

  const employees = useMemo(() => {
    let list = Array.from(employeeMap.values());
    if (schoolFilter) {
      list = list.filter(e => e.sekolah === schoolFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.nama || '').toLowerCase().includes(q) ||
        (e.nik || '').toLowerCase().includes(q) ||
        (e.nip || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [employeeMap, schoolFilter, search]);

  const allNames = useMemo(() => {
    return Array.from(employeeMap.values()).map(e => ({
      nama: e.nama || '',
      nik: e.nik || '',
      nip: e.nip || '',
      sekolah: e.sekolah || ''
    }));
  }, [employeeMap]);

  const suggestions = useMemo(() => {
    if (search.length < 3) return [];
    const q = search.toLowerCase();
    return allNames.filter(e =>
      (e.nama || '').toLowerCase().includes(q) ||
      (e.nik || '').toLowerCase().includes(q) ||
      (e.nip || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [allNames, search]);

  const uniqueSchools = useMemo(() => {
    const s = new Set<string>();
    allDocs.forEach(d => { if (d.sekolah) s.add(d.sekolah); });
    return Array.from(s).sort();
  }, [allDocs]);

  async function handleDeleteAll(nik: string) {
    const emp = employeeMap.get(nik);
    if (!emp || emp.docs.length === 0) return;
    if (!confirm(`Hapus ${emp.docs.length} dokumen milik ${emp.nama}?`)) return;
    for (const d of emp.docs) {
      try { if (d.id) await apiDelete('dokumen', d.id); } catch { }
    }
  }

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Dokumen Bersama">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin/super" className="text-white/80 hover:text-white"><ArrowLeft className="w-5 h-5" /></a>
          <FolderOpen className="w-5 h-5 text-yellow-400" />
          <h1 className="text-lg font-bold text-white">Dokumen Pegawai</h1>
        </div>
        <p className="text-sm text-blue-200">{employees.length} pegawai ({allDocs.length} dokumen)</p>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari NIP/NIK/nama..." value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-9 pr-3 py-2 text-sm border rounded-lg w-full bg-white dark:bg-gray-800" />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-60 overflow-auto">
                {suggestions.map((s, i) => (
                  <button key={i} type="button"
                    onMouseDown={() => { setSearch(s.nama); setShowSuggestions(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 border-b last:border-0 border-gray-100 dark:border-gray-700">
                    <span className="font-medium">{s.nama}</span>
                    <span className="text-xs text-muted-foreground ml-2">{s.nip || s.nik || ''}</span>
                    {s.sekolah && <span className="text-xs text-muted-foreground ml-2">— {s.sekolah}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 pr-8">
              <option value="">Semua Sekolah</option>
              {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : employees.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">{search || schoolFilter ? 'Tidak ada pegawai yang cocok' : 'Belum ada dokumen'}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-12">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIP/NIK</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sekolah</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Jumlah</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employees.map((e, i) => (
                    <tr key={e.nik || e.nip || e.nama} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{e.nama}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.nip || e.nik || '-'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{e.sekolah || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                          ${e.count >= 10 ? 'bg-green-100 text-green-700' :
                            e.count >= 5 ? 'bg-blue-100 text-blue-700' :
                            e.count >= 2 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'}`}>
                          {e.count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => { const key = e.nik || e.nip || e.nama; handleDeleteAll(key); }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">
              Menampilkan {employees.length} pegawai dari {employeeMap.size} total
              {schoolFilter ? ` (filter: ${schoolFilter})` : ''}
            </div>
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
