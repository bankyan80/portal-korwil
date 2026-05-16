'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BlueBarHeader } from '@/components/shared/SectionTitle';
import { useDataStore } from '@/store/data-store';
import type { GalleryItem } from '@/types';

function GallerySkeleton() {
  return (
    <div className="rounded-lg overflow-hidden shadow-sm">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function ImageViewer({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const [index, setIndex] = useState(0);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{item.title}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img src={item.images[index]} alt={`${item.title} - Foto ${index + 1}`} className="w-full h-auto max-h-[60vh] object-contain" />
          {item.images.length > 1 && (
            <>
              <Button variant="secondary" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white border-none" onClick={() => setIndex((i) => (i === 0 ? item.images.length - 1 : i - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white border-none" onClick={() => setIndex((i) => (i === item.images.length - 1 ? 0 : i + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {item.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />
            {item.category}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(item.createdAt), 'dd MMMM yyyy', { locale: idLocale })}
          </span>
        </div>
        {item.images.length > 1 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Foto {index + 1} dari {item.images.length}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Gallery() {
  const router = useRouter();
  const galleryItems = useDataStore((s) => s.galleryItems);
  const ready = useDataStore((s) => s.ready);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const published = galleryItems
    .filter((item) => item.status === 'published')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  return (
    <section>
      <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100">
        <BlueBarHeader title="Galeri Kegiatan" actionLabel="Lihat Semua" onAction={() => router.push('/semua-galeri')} />
        <div className="bg-white p-4">
          {!ready ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <GallerySkeleton key={i} />)}
            </div>
          ) : published.length === 0 ? (
            <div className="p-8 text-center">
              <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Belum ada galeri kegiatan</p>
              <p className="text-xs text-gray-400 mt-1">Foto kegiatan akan muncul di sini</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {published.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group border border-gray-100"
                  onClick={() => setSelected(item)}
                >
                  <div className="overflow-hidden">
                    <img src={item.images[0]} alt={item.title} className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-[#0d3b66] mb-1 line-clamp-2 leading-snug">{item.title}</h3>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selected && <ImageViewer item={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
