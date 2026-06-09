'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { LogOut, Shield } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SuperAdminDashboard() {
  const { user } = useAppStore();
  const router = useRouter();

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Dashboard Super Admin">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" /> Dashboard Super Admin
          </h1>
          <p className="text-sm text-blue-200">{user.displayName} • {user.email}</p>
        </div>
        <button onClick={() => window.location.href = '/login'}
          className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <p className="text-sm text-muted-foreground">Super Admin Dashboard</p>
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
