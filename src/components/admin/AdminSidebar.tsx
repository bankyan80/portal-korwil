'use client';

import { useAppStore } from '@/store/app-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { hasPermission, filterNavItems } from '@/lib/permissions';
import { getPathFromView } from '@/lib/navigation';
import type { NavItemPerm } from '@/lib/permissions';
import type { AppView } from '@/types';
import {
  LayoutDashboard,
  Bell,
  Camera,
  Building2,
  ExternalLink,
  Users,
  FileText,
  Database,
  UserPlus,
  ArrowLeft,
  LogOut,
  GraduationCap,
  BookOpen,
  WalletMinimal,
  Heart,
  BarChart3,
  School,
  CalendarDays,
  BadgeCheck,
  FileBarChart,
  Activity,
  Settings,
  Shield,
  RefreshCw,
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
    title: 'Super Admin',
    items: [
      { label: 'Super Dashboard', icon: Shield, view: 'super-dashboard', permission: 'manage-schools' },
      { label: 'Data Sekolah', icon: School, view: 'super-schools', permission: 'manage-schools' },
      { label: 'Monitoring', icon: Activity, view: 'super-monitoring', permission: 'manage-monitoring' },
      { label: 'Pengaturan Portal', icon: Settings, view: 'super-settings', permission: 'manage-settings' },
      { label: 'Update Data', icon: RefreshCw, view: 'super-update-data', permission: 'manage-schools' },
    ],
  },
  {
    title: 'Konten',
    items: [
      { label: 'Kelola Informasi', icon: Bell, view: 'admin-manage-announcements', permission: 'manage-announcements' },
      { label: 'Kelola Galeri', icon: Camera, view: 'admin-manage-gallery', permission: 'manage-gallery' },
      { label: 'Agenda Kegiatan', icon: CalendarDays, view: 'admin-manage-agenda-kegiatan', permission: 'manage-agenda-kegiatan' },
      { label: 'Verifikasi Konten', icon: BadgeCheck, view: 'admin-verifikasi-konten', permission: 'manage-content-verification' },
    ],
  },
  {
    title: 'Laporan',
    items: [
      { label: 'Laporan & Ekspor', icon: FileBarChart, view: 'admin-laporan', permission: 'view-reports' },
    ],
  },
  {
    title: 'Data',
    items: [
      { label: 'Data PD', icon: BookOpen, view: 'admin-manage-data-pd', permission: 'manage-data-pd' },
      { label: 'Data GTK', icon: GraduationCap, view: 'admin-manage-data-gtk', permission: 'manage-data-gtk' },
      { label: 'KIP SD', icon: WalletMinimal, view: 'admin-manage-kip-sd', permission: 'manage-kip-sd' },
      { label: 'Yatim Piatu', icon: Heart, view: 'admin-manage-yatim-piatu', permission: 'manage-yatim-piatu' },
    ],
  },
  {
    title: 'Sekolah',
    items: [
      { label: 'Laporan Bulanan', icon: BarChart3, view: 'admin-manage-laporan-bulanan', permission: 'manage-laporan-bulanan' },
      { label: 'SPMB SD', icon: School, view: 'admin-manage-spmb-sd', permission: 'manage-spmb-sd' },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { label: 'Kelola Organisasi', icon: Building2, view: 'admin-manage-organizations', permission: 'manage-organizations' },
      { label: 'Kelola Link Instansi', icon: ExternalLink, view: 'admin-manage-institution-links', permission: 'manage-institution-links' },
      { label: 'Kelola User', icon: Users, view: 'admin-manage-users', permission: 'manage-users' },
      { label: 'Input Dokumen', icon: FileText, view: 'admin-manage-documents', permission: 'manage-documents' },
      { label: 'Backup & Restore', icon: Database, view: 'admin-backup-restore', permission: 'backup-restore' },
      { label: 'Tambah Pegawai', icon: UserPlus, view: 'admin-tambah-pegawai', permission: 'add-employees' },
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
          onClick={() => {
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
