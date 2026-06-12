'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user, isLoadingAuth } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      router.replace('/login?callbackUrl=/admin');
      return;
    }
    switch (user.role) {
      case 'operator_sekolah':
        router.replace('/admin/operator');
        break;
      case 'super_admin':
        router.replace('/admin/super');
        break;
      default:
        router.replace('/');
    }
  }, [user, isLoadingAuth, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
      <div className="flex items-center gap-3 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span>Mengalihkan...</span>
      </div>
    </div>
  );
}
