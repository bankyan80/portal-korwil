'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { Building2, Calendar, FileText, Image, Megaphone, LogOut } from 'lucide-react';

export default function OrganisasiDashboard() {
  const { user, setUser } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || !['ketua_organisasi'].includes(user.role)) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const menu = [
    { label: 'Profil Organisasi', icon: Building2, desc: 'Kelola profil dan struktur organisasi', href: '/admin/organisasi/profil' },
    { label: 'Program Kerja', icon: FileText, desc: 'Program kerja organisasi', href: '/admin/organisasi/program-kerja' },
    { label: 'Agenda', icon: Calendar, desc: 'Kalender agenda organisasi', href: '/admin/organisasi/agenda' },
    { label: 'Berita', icon: Megaphone, desc: 'Kelola berita dan pengumuman', href: '/admin/organisasi/berita' },
    { label: 'Galeri', icon: Image, desc: 'Dokumentasi kegiatan', href: '/admin/organisasi/galeri' },
  ];

  function handleLogout() {
    if (auth) { auth.signOut(); }
    setUser(null);
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Dashboard Organisasi</h1>
          <p className="text-sm text-blue-200">{user.displayName} • {user.organization || 'Organisasi'}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menu.map((item) => (
            <a key={item.label} href={item.href}
              className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5 text-left hover:shadow-md transition-shadow block">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
              </div>
              <p className="text-xs text-muted-foreground ml-13">{item.desc}</p>
            </a>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Selamat datang, {user.displayName}</h2>
          <p className="text-sm text-muted-foreground">
            Dashboard ini akan menampilkan agenda, berita terbaru, dan statistik organisasi Anda.
          </p>
        </div>
      </main>
    </div>
  );
}
