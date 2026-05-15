'use client';

import { useState } from 'react';
import { ArrowLeft, Calendar, Bell, Search, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useDataStore } from '@/store/data-store';
import { truncate } from '@/lib/truncate';
import Footer from '@/components/portal/Footer';

const formatDay = (ts: number) => format(new Date(ts), 'dd', { locale: idLocale });
const formatMonth = (ts: number) => format(new Date(ts), 'MMM', { locale: idLocale }).toUpperCase();
const formatFull = (ts: number) => format(new Date(ts), 'dd MMMM yyyy', { locale: idLocale });

export default function SemuaInformasiPage() {
  const announcements = useDataStore((s) => s.announcements);
  const [search, setSearch] = useState('');
  const allAnnouncements = [...announcements]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((item) =>
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.author.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/#informasi" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Semua Informasi</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0d3b66]">Semua Informasi</h2>
            <p className="text-sm text-gray-500 mt-1">{allAnnouncements.length} informasi</p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Cari informasi..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm divide-y">
          {allAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Inbox className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">Informasi tidak ditemukan</p>
              <p className="text-xs mt-1">Coba gunakan kata kunci lain</p>
            </div>
          ) : (
            allAnnouncements.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-5 hover:bg-blue-50/30 transition-colors">
                <div className="shrink-0 w-14 h-14 rounded-full bg-[#0d3b66] flex flex-col items-center justify-center text-white">
                  <span className="text-lg font-bold leading-none">{formatDay(item.createdAt)}</span>
                  <span className="text-[10px] uppercase mt-0.5">{formatMonth(item.createdAt)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.pinned && <span className="text-[10px] font-bold uppercase text-red-500 tracking-wider">TERPIN</span>}
                    <h3 className="text-sm font-semibold text-[#0d3b66] leading-snug">{item.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-1">{truncate(item.content, 200)}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatFull(item.createdAt)}
                    </span>
                    <span>Oleh {item.author}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
