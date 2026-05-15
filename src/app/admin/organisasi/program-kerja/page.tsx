'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { ManageProgramKerja } from '@/components/admin/ManageProgramKerja';
import { ArrowLeft } from 'lucide-react';

export default function OrganisasiProgramKerjaPage() {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || !['ketua_organisasi'].includes(user.role)) router.push('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/organisasi')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Program Kerja</h1>
            <p className="text-sm text-muted-foreground">Program kerja organisasi</p>
          </div>
        </div>
        <ManageProgramKerja />
      </div>
    </div>
  );
}
