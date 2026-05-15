'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/app-store';
import { useDataStore } from '@/store/data-store';
import { hasPermission } from '@/lib/permissions';
import {
  LayoutGrid,
  Bell,
  Camera,
  Building2,
  TrendingUp,
  Clock,
  FileText,
  ImagePlus,
  ArrowRight,
  Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
  bg: string;
  iconBg: string;
  iconColor: string;
}

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: LucideIcon;
  iconColor: string;
}

const mockActivities: ActivityItem[] = [
  { id: 'act-1', action: 'Informasi baru ditambahkan', detail: 'PPDB Tahun Ajaran 2025/2026', time: '2 jam yang lalu', icon: Bell, iconColor: 'text-amber-600' },
  { id: 'act-2', action: 'Galeri disetujui', detail: 'Upacara Hari Pendidikan Nasional 2025', time: '5 jam yang lalu', icon: Camera, iconColor: 'text-green-600' },
  { id: 'act-3', action: 'Menu diperbarui', detail: 'Urutan menu Data SD diubah', time: '1 hari yang lalu', icon: LayoutGrid, iconColor: 'text-blue-600' },
  { id: 'act-4', action: 'User baru terdaftar', detail: 'Operator SDN 2 Lemahabang', time: '2 hari yang lalu', icon: TrendingUp, iconColor: 'text-purple-600' },
  { id: 'act-5', action: 'Organisasi ditambahkan', detail: 'Forum Komunikasi Guru Olahraga', time: '3 hari yang lalu', icon: Building2, iconColor: 'text-teal-600' },
];

export function AdminDashboard() {
  const { setCurrentView, user } = useAppStore();
  const { menus, announcements, galleryItems, organizations } = useDataStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats: StatCard[] = [
    { label: 'Total Menu Aktif', value: menus.filter((m) => m.active).length, icon: LayoutGrid, bg: 'bg-blue-50 dark:bg-blue-950/40', iconBg: 'bg-blue-100 dark:bg-blue-900/60', iconColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'Total Informasi', value: announcements.length, icon: Bell, bg: 'bg-green-50 dark:bg-green-950/40', iconBg: 'bg-green-100 dark:bg-green-900/60', iconColor: 'text-green-600 dark:text-green-400' },
    { label: 'Galeri Published', value: galleryItems.filter((g) => g.status === 'published').length, icon: Camera, bg: 'bg-amber-50 dark:bg-amber-950/40', iconBg: 'bg-amber-100 dark:bg-amber-900/60', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Total Organisasi', value: organizations.length, icon: Building2, bg: 'bg-purple-50 dark:bg-purple-950/40', iconBg: 'bg-purple-100 dark:bg-purple-900/60', iconColor: 'text-purple-600 dark:text-purple-400' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton className="h-72 rounded-xl" /></div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${stat.iconBg}`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Aktivitas Terbaru
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{mockActivities.length} aktivitas</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {mockActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0 mt-0.5">
                      <Icon className={`w-4 h-4 ${activity.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{activity.action}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              Aksi Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {hasPermission(user?.role, 'manage-announcements') && (
              <QuickActionButton
                icon={FileText}
                bg="bg-blue-800 hover:bg-blue-900"
                title="Tambah Informasi"
                desc="Buat informasi baru"
                onClick={() => setCurrentView('admin-manage-announcements')}
              />
            )}
            {hasPermission(user?.role, 'manage-gallery') && (
              <QuickActionButton
                icon={ImagePlus}
                bg="bg-green-700 hover:bg-green-800"
                title="Upload Galeri"
                desc="Tambah foto kegiatan"
                onClick={() => setCurrentView('admin-manage-gallery')}
              />
            )}
            {hasPermission(user?.role, 'manage-users') && (
              <QuickActionButton
                icon={TrendingUp}
                bg="bg-white border hover:bg-muted"
                title="Kelola User"
                desc="Atur pengguna portal"
                variant="outline"
                onClick={() => setCurrentView('admin-manage-users')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  bg,
  title,
  desc,
  variant,
  onClick,
}: {
  icon: LucideIcon;
  bg: string;
  title: string;
  desc: string;
  variant?: 'outline';
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      className={`w-full justify-start gap-3 h-12 ${bg} ${variant === 'outline' ? 'text-foreground' : 'text-white'}`}
      variant={variant}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${variant === 'outline' ? 'bg-muted' : 'bg-white/20'}`}>
        <Icon className={`w-4 h-4 ${variant === 'outline' ? 'text-muted-foreground' : ''}`} />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium">{title}</p>
        <p className={`text-xs ${variant === 'outline' ? 'text-muted-foreground' : 'opacity-75'}`}>{desc}</p>
      </div>
      <ArrowRight className={`w-4 h-4 ml-auto ${variant === 'outline' ? 'text-muted-foreground' : 'opacity-60'}`} />
    </Button>
  );
}
