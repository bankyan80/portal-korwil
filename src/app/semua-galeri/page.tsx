'use client';

import { useState } from 'react';
import { ArrowLeft, Camera, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useDataStore } from '@/store/data-store';
import Footer from '@/components/portal/Footer';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryItem } from '@/types';

function ImageViewer({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{item.title}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
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
                  <button key={idx} onClick={() => setIndex(idx)} className={`w-2 h-2 rounded-full transition-colors ${idx === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`} />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" />{item.category}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(item.createdAt), 'dd MMMM yyyy', { locale: idLocale })}</span>
        </div>
        {item.images.length > 1 && <p className="text-xs text-gray-500 text-center">Foto {index + 1} dari {item.images.length}</p>}
      </DialogContent>
    </Dialog>
  );
}

export default function SemuaGaleriPage() {
  const galleryItems = useDataStore((s) => s.galleryItems);
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const published = [...galleryItems]
    .filter((item) => item.status === 'published')
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/#galeri" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Semua Galeri</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Semua Galeri Kegiatan</h2>
          <p className="text-sm text-gray-500 mt-1">{published.length} kegiatan</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {published.map((item) => (
            <div
              key={item.id}
              className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group border border-gray-100 bg-white"
              onClick={() => setSelected(item)}
            >
              <div className="overflow-hidden">
                <img src={item.images[0]} alt={item.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
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
      </main>

      {selected && <ImageViewer item={selected} onClose={() => setSelected(null)} />}
      <Footer />
    </div>
  );
}
