'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { LoginForm } from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const isLoadingAuth = useAppStore((s) => s.isLoadingAuth);
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current || isLoadingAuth) return;
    if (!user) return;
    redirected.current = true;
    router.replace('/');
  }, [user, isLoadingAuth, router]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}
