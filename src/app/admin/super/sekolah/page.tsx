'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperSekolahPage() {
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

  return (
    <SuperPageShell title="Data Sekolah" subtitle="Daftar seluruh sekolah binaan">
      {loading ? (
        <p className="text-muted-foreground">Memuat data...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">#</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Nama Sekolah</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">NPSN</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Jenjang</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Kepala Sekolah</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Alamat</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {schools.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.npsn || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' :
                        s.jenjang === 'TK' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                      }`}>{s.jenjang || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.status || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.kepalaSekolah || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{s.alamat || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t dark:border-gray-700 text-xs text-gray-500">
            Total: {schools.length} sekolah
          </div>
        </div>
      )}
    </SuperPageShell>
  );
}
