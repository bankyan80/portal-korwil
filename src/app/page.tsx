'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import PortalView from '@/components/portal/PortalView';
import ChatPage from '@/components/portal/ChatPage';
import AdminView from '@/components/admin/AdminView';
import { LoginForm } from '@/components/auth/LoginForm';
import KipSdPage from '@/app/kip-sd/page';
import { getViewFromPath, getPathFromView } from '@/lib/navigation';

const ADMIN_VIEW_PREFIXES = ['admin', 'super-', 'org-', 'op-'];

export default function Home() {
  const { currentView, setCurrentView } = useAppStore();
  const pathname = usePathname();

  useEffect(() => {
    const view = getViewFromPath(window.location.pathname);
    if (view !== 'portal') setCurrentView(view);
  }, [setCurrentView, pathname]);

  useEffect(() => {
    const isAdminView = ADMIN_VIEW_PREFIXES.some(p => currentView.startsWith(p));
    if (isAdminView) {
      const target = getPathFromView(currentView);
      if (window.location.pathname !== target) {
        window.history.replaceState(null, '', target);
      }
    }
  }, [currentView]);

  if (currentView === 'login') return <LoginForm />;
  if (currentView === 'chat') return <ChatPage />;
  if (currentView === 'kip-sd') return <KipSdPage />;
  if (ADMIN_VIEW_PREFIXES.some(p => currentView.startsWith(p))) return <AdminView />;
  return <PortalView />;
}
