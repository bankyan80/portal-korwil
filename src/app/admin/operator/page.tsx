'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { LogOut, Users } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';

export default function OperatorDashboard() {
  const { user } = useAppStore();
  const router = useRouter();

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['operator_sekolah', 'super_admin']} requireActive featureName="Dashboard Operator">
    <SimpleAdminLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-0 sm:p-2">
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6">
          <p className="text-sm text-muted-foreground">Operator Dashboard</p>
        </div>
      </main>
    </div>
    </SimpleAdminLayout>
    </AuthGuard>
  );
}
