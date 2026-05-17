'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { sekolahSD, sekolahTK, sekolahKB } from '@/data/sekolah';
import { Search, School, MapPin, BadgeCheck, Loader2 } from 'lucide-react';
import type { School as SchoolType } from '@/types';

type Jenjang = 'SD' | 'TK' | 'KB' | 'PAUD';

interface SchoolItem {
  id?: string;
  nama: string;
  npsn?: string;
  jenjang: string;
  alamat?: string;
  status?: string;
  desa?: string;
  kontak?: string;
  kepalaSekolah?: string;
}

const staticSchools: SchoolItem[] = [
  ...sekolahSD.map(s => ({ ...s, jenjang: 'SD' as const })),
  ...sekolahTK.map(s => ({ ...s, jenjang: 'TK' as const })),
  ...sekolahKB.map(s => ({ ...s, jenjang: 'KB' as const })),
];

export default function DataSekolahPage() {
  const [schools, setSchools] = useState<SchoolItem[]>(staticSchools);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [jenjang, setJenjang] = useState<Jenjang | 'all'>('all');

  useEffect(() => {
    if (!db) { setLoading(false); return; }

    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'schools'),
      (snap) => {
        if (snap.size > 0) {
          const fb: SchoolItem[] = snap.docs.map((d: any) => ({
            id: d.id,
            nama: d.name || d.nama || '',
            npsn: d.npsn || '-',
            jenjang: d.jenjang || 'SD',
            alamat: d.alamat || '',
            status: d.status || 'NEGERI',
            desa: d.desa || '',
            kontak: d.kontak || '',
            kepalaSekolah: d.kepalaSekolah || '-',
          }));
          setSchools(fb);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error in schools realtime listener:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    return schools.filter(s => {
      if (jenjang !== 'all' && s.jenjang !== jenjang) return false;
      if (search && !s.nama.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [schools, search, jenjang]);

  const counts = { SD: 0, TK: 0, KB: 0 };
  schools.forEach(s => { if (s.jenjang in counts) counts[s.jenjang as keyof typeof counts]++; });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Sekolah</h1>
          <p className="text-sm text-muted-foreground">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(['SD', 'TK', 'KB'] as const).map(j => (
            <button key={j} onClick={() => setJenjang(j === jenjang ? 'all' : j)}
              className={`rounded-xl border p-4 text-center transition-all ${
                jenjang === j
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-sm'
              }`}>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts[j]}</p>
              <p className="text-sm text-muted-foreground">Sekolah {j}</p>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Cari nama sekolah..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
        </div>

        <div className="grid gap-4">
          {filtered.map((s, i) => (
            <div key={s.id || i} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                    <School className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{s.nama}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">{s.jenjang}</span>
                      {s.npsn && s.npsn !== '-' && <span>NPSN: {s.npsn}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {s.alamat && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.alamat}</span>}
                {s.status && <span className="flex items-center gap-1"><BadgeCheck className="w-3 h-3" />{s.status}</span>}
                {s.kepalaSekolah && s.kepalaSekolah !== '-' && <span>Kepsek: {s.kepalaSekolah}</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-10 text-muted-foreground">Sekolah tidak ditemukan</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {schools === staticSchools ? 'Data dari database statis' : 'Data dari Firebase Firestore'}
        </p>
      </div>
    </div>
  );
}
