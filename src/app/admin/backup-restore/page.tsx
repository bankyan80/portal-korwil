'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import BackupRestore from '@/components/admin/BackupRestore';

export default function BackupRestorePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-300 hover:text-blue-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white">Backup & Restore Database</h1>
      </header>
      <main className="p-6 max-w-4xl mx-auto">
        <BackupRestore />
      </main>
    </div>
  );
}
