'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { School, MapPin, Users, GraduationCap } from 'lucide-react';

export default function SuperSekolahPage() {
  const { user } = useAppStore();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    getDocs(collection(db, 'schools')).then((snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setSchools(list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Data Sekolah</h1>
        <p className="text-sm text-muted-foreground">Daftar seluruh sekolah binaan</p>

        {loading ? (
          <p className="text-muted-foreground">Memuat data...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((s) => (
              <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <School className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">NPSN: {s.npsn || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GraduationCap className="w-3.5 h-3.5" /> {s.jenjang || '-'}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" /> {s.status || '-'}
                  </div>
                </div>
                {s.alamat && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" /> {s.alamat}
                  </p>
                )}
                {s.kepalaSekolah && (
                  <p className="text-xs text-muted-foreground">Kepsek: {s.kepalaSekolah}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
