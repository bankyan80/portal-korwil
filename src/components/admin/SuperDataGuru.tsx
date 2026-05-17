'use client';

import { usePegawaiAll } from '@/hooks/usePegawai';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Users, GraduationCap, BookOpen, ChevronDown } from 'lucide-react';

function groupBySchool(items: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const key = item.sekolah || '-';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function countByRole(records: any[]) {
  let guru = 0, tendik = 0;
  for (const r of records) {
    if (r.jenis_ptk === 'Guru') guru++;
    else if (r.jenis_ptk === 'Tenaga Kependidikan') tendik++;
  }
  return { guru, tendik };
}

export default function SuperDataGuru() {
  const [openSchools, setOpenSchools] = useState<Set<string>>(new Set());

  const { data: allDataResult, isLoading } = usePegawaiAll();

  const toggleSchool = (school: string) => {
    setOpenSchools(prev => {
      const next = new Set(prev);
      if (next.has(school)) next.delete(school);
      else next.add(school);
      return next;
    });
  };

  const allItems = allDataResult?.items || [];
  const groups = useMemo(() => {
    const g = groupBySchool(allItems);
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [allItems]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Data GTK</h1>
      <p className="text-sm text-muted-foreground mb-4">Seluruh data pendidik dan tenaga kependidikan semua sekolah</p>

      {isLoading && !allDataResult && (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" /> Memuat data...
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="text-sm text-muted-foreground py-4">Belum ada data GTK</div>
      )}

      {/* Per-sekolah grouped view */}
      {groups.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Per Sekolah — klik untuk expand</h2>
          <div className="space-y-2">
            {groups.map(([school, records]) => {
              const { guru, tendik } = countByRole(records);
              const isOpen = openSchools.has(school);

              return (
                <Collapsible
                  key={school}
                  open={isOpen}
                  onOpenChange={() => toggleSchool(school)}
                >
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <CollapsibleTrigger className="w-full text-left">
                      <div className="flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <Users className="w-5 h-5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-[#0d3b66] truncate">{school}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <GraduationCap className="w-3 h-3" /> {guru} Guru
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              <BookOpen className="w-3 h-3" /> {tendik} Tendik
                            </span>
                            <span className="text-gray-500">{records.length} total</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t">
                        {records.some(r => r.jenis_ptk === 'Guru') && (
                          <div className="px-5 py-2 bg-blue-50/50 dark:bg-blue-900/10">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                              Guru ({records.filter(r => r.jenis_ptk === 'Guru').length})
                            </p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left py-1 pr-3">Nama</th>
                                  <th className="text-left py-1 pr-3">NIP</th>
                                  <th className="text-left py-1 pr-3">NUPTK</th>
                                  <th className="text-left py-1">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {records.filter(r => r.jenis_ptk === 'Guru').map((r, i) => (
                                  <tr key={r.nip || r.nik || i} className="border-t">
                                    <td className="py-1.5 pr-3 font-medium">{r.nama}</td>
                                    <td className="py-1.5 pr-3 font-mono">{r.nip || '-'}</td>
                                    <td className="py-1.5 pr-3">{r.nuptk || '-'}</td>
                                    <td className="py-1.5"><Badge variant="outline" className="text-[10px]">{r.status_kepegawaian}</Badge></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {records.some(r => r.jenis_ptk === 'Tenaga Kependidikan') && (
                          <div className="px-5 py-2 bg-purple-50/50 dark:bg-purple-900/10">
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-1">
                              Tenaga Kependidikan ({records.filter(r => r.jenis_ptk === 'Tenaga Kependidikan').length})
                            </p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left py-1 pr-3">Nama</th>
                                  <th className="text-left py-1 pr-3">NIP</th>
                                  <th className="text-left py-1 pr-3">NUPTK</th>
                                  <th className="text-left py-1">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {records.filter(r => r.jenis_ptk === 'Tenaga Kependidikan').map((r, i) => (
                                  <tr key={r.nip || r.nik || i} className="border-t">
                                    <td className="py-1.5 pr-3 font-medium">{r.nama}</td>
                                    <td className="py-1.5 pr-3 font-mono">{r.nip || '-'}</td>
                                    <td className="py-1.5 pr-3">{r.nuptk || '-'}</td>
                                    <td className="py-1.5"><Badge variant="outline" className="text-[10px]">{r.status_kepegawaian}</Badge></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
