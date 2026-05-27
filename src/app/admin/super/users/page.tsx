'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { ManageUsers } from '@/components/admin/ManageUsers';
import SuperPageShell from '@/components/admin/SuperPageShell';

export default function SuperUsersPage() {
  const { user, setUser } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') router.push('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <SuperPageShell title="Kelola User" subtitle={user.displayName}>
      <ManageUsers />
    </SuperPageShell>
  );
}
