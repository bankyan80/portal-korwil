'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BlueBarHeader } from '@/components/shared/SectionTitle';
import { truncate } from '@/lib/truncate';
import { useDataStore } from '@/store/data-store';

function AnnouncementSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b last:border-b-0">
      <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
}

const formatDay = (ts: number) => format(new Date(ts), 'dd', { locale: idLocale });
const formatMonth = (ts: number) => format(new Date(ts), 'MMM', { locale: idLocale }).toUpperCase();

export default function Announcements() {
  const router = useRouter();
  const announcements = useDataStore((s) => s.announcements);
  const ready = useDataStore((s) => s.ready);
  const displayed = [...announcements].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  return (
    <section>
      <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100">
        <BlueBarHeader title="Informasi Terbaru" actionLabel="Lihat Semua" onAction={() => router.push('/semua-informasi')} />
        <div className="bg-white">
          {!ready ? (
            <div className="p-2">
              {Array.from({ length: 3 }).map((_, i) => <AnnouncementSkeleton key={i} />)}
            </div>
          ) : displayed.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Belum ada informasi</p>
              <p className="text-xs text-gray-400 mt-1">Informasi terbaru akan muncul di sini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayed.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#0d3b66] flex flex-col items-center justify-center text-white">
                    <span className="text-lg font-bold leading-none">{formatDay(item.createdAt)}</span>
                    <span className="text-[10px] uppercase mt-0.5">{formatMonth(item.createdAt)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#0d3b66] mb-1 leading-snug line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{truncate(item.content, 120)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
