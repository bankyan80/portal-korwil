'use client';

import { ArrowLeft, Users, ChevronRight } from 'lucide-react';
import { useDataStore } from '@/store/data-store';

const ORG_COLORS = [
  '#2563eb', '#059669', '#dc2626', '#ea580c',
  '#7c3aed', '#0d9488', '#1d4ed8', '#475569',
];

function getInitials(name: string) {
  const match = name.match(/\(([^)]+)\)/);
  if (match) return match[1].replace(/\s/g, '').slice(0, 3);
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 3).join('').toUpperCase();
}

export default function OrganisasiPage() {
  const organizations = useDataStore((s) => s.organizations).filter((o) => o.active);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/#organisasi" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Organisasi Pendidikan</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organisasi Pendidikan</h1>
          <p className="text-sm text-muted-foreground">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        {organizations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada organisasi yang terdaftar.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Admin dapat menambahkan organisasi melalui panel admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org, index) => (
              <a
                key={org.id}
                href={`/organisasi/${org.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  {org.logo && !org.logo.includes('placehold.co') ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                      style={{ backgroundColor: ORG_COLORS[index % ORG_COLORS.length] }}
                    >
                      {getInitials(org.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug group-hover:text-blue-700 transition-colors">
                      {org.name}
                    </h3>
                    {org.leader && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        Ketua: {org.leader}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
