'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAppStore } from '@/store/app-store';

interface SuperPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function SuperPageShell({ title, subtitle, children, maxWidth = 'max-w-7xl' }: SuperPageShellProps) {
  const { setUser } = useAppStore();
  const router = useRouter();

  function handleLogout() {
    if (auth) auth.signOut();
    setUser(null);
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="text-blue-300 hover:text-blue-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-blue-200">{subtitle}</p>}
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>
      <main className={`p-6 ${maxWidth} mx-auto`}>
        {children}
      </main>
    </div>
  );
}
