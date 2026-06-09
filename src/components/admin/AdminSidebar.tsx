'use client';

import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hasPermission, filterNavItems } from '@/lib/permissions';
import { getPathFromView } from '@/lib/navigation';
import type { NavItemPerm } from '@/lib/permissions';
import type { AppView } from '@/types';
import {
  LayoutDashboard,
  Users,
  ArrowLeft,
  LogOut,
  GraduationCap,
  KeyRound,
} from 'lucide-react';

interface NavSection {
  title: string;
  items: NavItemPerm[];
}

const navSections: NavSection[] = [
  {
    title: 'Umum',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, view: 'admin', permission: 'view-admin' },
    ],
  },
  {
    title: 'Data Siswa',
    items: [
      { label: 'Edit Data Siswa', icon: Users, view: 'admin-manage-data-pd', permission: 'manage-data-pd' },
    ],
  },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  operator_sekolah: 'Operator',
  organisasi: 'Organisasi',
  ketua_organisasi: 'Ketua Organisasi',
  viewer: 'Pengguna',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const { currentView, setCurrentView, user, setUser } = useAppStore();

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.history.replaceState(null, '', getPathFromView(view));
    onNavigate?.();
  };

   return (
     <aside className="flex flex-col h-full w-64 bg-gradient-to-b from-blue-900 to-blue-950 text-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-800/60">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm shrink-0">
          <GraduationCap className="w-6 h-6 text-yellow-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold leading-tight truncate">Portal Pendidikan</h2>
          <p className="text-[11px] text-blue-300 leading-tight truncate">Kec. Lemahabang</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        {navSections.map((section) => {
          const visibleItems = filterNavItems(section.items, user?.role);
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              <div className="px-2 pb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">{section.title}</span>
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => handleNavigate(item.view)}
                      className={cn(
                        'group flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 text-left',
                        isActive
                          ? 'bg-white/15 text-white shadow-sm shadow-blue-900/30'
                          : 'text-blue-200 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <span
                        className={cn(
                          'flex items-center justify-center w-7 h-7 rounded-md transition-all duration-150 shrink-0',
                          isActive
                            ? 'bg-white/20 text-yellow-400'
                            : 'bg-white/5 text-blue-300 group-hover:bg-white/10 group-hover:text-white',
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="mx-5 border-t border-blue-800/60" />
      <div className="px-3 py-3 space-y-1">
        {user?.role === 'operator_sekolah' && (
          <button
            onClick={() => { window.location.assign('/admin/operator/profil-sekolah'); }}
            className="group flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150 text-left"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-md bg-white/5 text-blue-300 group-hover:bg-white/10 group-hover:text-white transition-all duration-150 shrink-0">
              <KeyRound className="w-4 h-4" />
            </span>
            <span className="truncate">Profil & Password</span>
          </button>
        )}
        <button
          onClick={() => handleNavigate('portal')}
          className="group flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150 text-left"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-md bg-white/5 text-blue-300 group-hover:bg-white/10 group-hover:text-white transition-all duration-150 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </span>
          <span className="truncate">Kembali ke Portal</span>
        </button>
        <button
          onClick={async () => {
            document.cookie = 'auth-token=; path=/; max-age=0';
            if (auth) {
              try { await signOut(auth); } catch {}
            }
            setUser(null);
            setCurrentView('portal');
            onNavigate?.();
          }}
          className="group flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-all duration-150 text-left"
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-md bg-red-500/10 text-red-400 group-hover:bg-red-500/20 group-hover:text-red-300 transition-all duration-150 shrink-0">
            <LogOut className="w-4 h-4" />
          </span>
          <span className="truncate">Logout</span>
        </button>
      </div>
      {user && (
        <div className="border-t border-blue-800/60 px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-blue-700">
              <AvatarImage src={user.photoURL} alt={user.displayName} />
              <AvatarFallback className="bg-blue-700 text-white text-xs font-semibold">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate leading-tight">{user.displayName}</p>
              <Badge variant="secondary" className="mt-1 text-[10px] bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30 px-1.5 py-0">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
