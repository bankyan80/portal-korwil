'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { ManageUsers } from '@/components/admin/ManageUsers';
import { Shield, ArrowLeft, LogOut } from 'lucide-react';

export default function SuperUsersPage() {
  const { user, setUser } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') router.push('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="text-blue-300 hover:text-blue-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5" /> Kelola User
            </h1>
            <p className="text-sm text-blue-200">{user.displayName}</p>
          </div>
        </div>
        <button onClick={() => { auth?.signOut(); setUser(null); router.push('/'); }}
          className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <ManageUsers />
      </main>
    </div>
  );
}
