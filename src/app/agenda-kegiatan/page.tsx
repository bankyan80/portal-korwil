'use client';

import { useState } from 'react';
import Footer from '@/components/portal/Footer';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { CalendarDays, Search, Loader2, Clock, MapPin } from 'lucide-react';
import type { CalendarEvent } from '@/types';

const defaultData: CalendarEvent[] = [
  { id: 'agenda-1', title: 'Hari Pertama Masuk Sekolah', description: 'Hari pertama masuk sekolah TP 2025/2026', tanggal: '14 Juli 2025', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() },
  { id: 'agenda-2', title: 'MPLS', description: 'Masa Pengenalan Lingkungan Sekolah', tanggal: '14-18 Juli 2025', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 86400000 },
  { id: 'agenda-3', title: 'HUT Kemerdekaan RI', description: 'Libur Nasional', tanggal: '17 Agustus 2025', lokasi: '-', type: 'holiday', organizerName: 'Admin', createdAt: Date.now() - 172800000 },
  { id: 'agenda-4', title: 'Asesmen Nasional SMP', description: 'Pelaksanaan AN SMP/Paket B', tanggal: '25-28 Agustus 2025', lokasi: 'SMP', type: 'exam', organizerName: 'Admin', createdAt: Date.now() - 259200000 },
  { id: 'agenda-5', title: 'Maulid Nabi Muhammad SAW', description: 'Libur Nasional', tanggal: '5 September 2025', lokasi: '-', type: 'holiday', organizerName: 'Admin', createdAt: Date.now() - 345600000 },
  { id: 'agenda-6', title: 'Tes Kompetensi Akademik', description: 'Prakiraan Tes Kompetensi Akademik Paket C', tanggal: '1-19 November 2025', lokasi: 'Sekolah', type: 'exam', organizerName: 'Admin', createdAt: Date.now() - 432000000 },
  { id: 'agenda-7', title: 'Hari Pertama Masuk Sekolah Semester 2', description: 'Prakiraan Hari pertama masuk sekolah semester 2', tanggal: '12 Januari 2026', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 518400000 },
  { id: 'agenda-8', title: 'Pembagian Rapor', description: 'Prakiraan Pembagian rapor semester 2 dan kenaikan kelas', tanggal: '24-26 Juni 2026', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 604800000 },
  { id: 'agenda-9', title: 'Libur Akhir Tahun Pelajaran', description: 'Prakiraan Libur akhir tahun pelajaran', tanggal: '29 Juni - 11 Juli 2026', lokasi: '-', type: 'holiday', organizerName: 'Admin', createdAt: Date.now() - 691200000 },
  { id: 'agenda-10', title: 'Hari Pertama Masuk Sekolah TP 2026/2027', description: 'Prakiraan Hari Pertama Masuk Sekolah Tahun Pelajaran 2026/2027', tanggal: '13 Juli 2026', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 777600000 },
];

export default function AgendaKegiatanPage() {
  const { items: data, loading } = useFirestoreCollection<CalendarEvent>('calendar_events', defaultData);
  const [search, setSearch] = useState('');

  const filtered = data.filter((d) =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.tanggal.includes(search)
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="w-20"></div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">KALENDER PENDIDIKAN</h1>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0d3b66] mb-2">TAHUN PELAJARAN 2025/2026</h2>
              <h3 className="text-lg font-semibold text-gray-700">DINAS PENDIDIKAN KABUPATEN CIREBON</h3>
              <p className="text-sm text-gray-600 mt-4">
                Lampiran II Surat Kepala Dinas Pendidikan Kabupaten Cirebon<br />
                Nomor : 421.22 / 2904 / Disdik<br />
                Tanggal : 7 Juli 2025<br />
                Hal : Pedoman Penyusunan Kalender Pendidikan Tahun Pelajaran 2025/2026
              </p>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="Cari agenda..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full"
                />
              </div>
              <span className="text-xs text-gray-500">{filtered.length} agenda</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Agenda tidak ditemukan</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row">
                      <div className="bg-blue-800 text-white px-4 py-3 sm:w-44 shrink-0 flex sm:flex-col items-center sm:items-start justify-center gap-1">
                        <CalendarDays className="w-5 h-5 sm:mb-1" />
                        <p className="text-sm font-semibold text-center sm:text-left leading-tight">{item.tanggal}</p>
                      </div>
                      <div className="flex-1 p-4">
                        <h3 className="font-semibold text-[#0d3b66]">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {item.waktu && (
                            <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.waktu}</p>
                          )}
                          {item.lokasi && item.lokasi !== '-' && (
                            <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.lokasi}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> Kalender pendidikan ini dapat berubah sesuai dengan kebijakan Dinas Pendidikan Kabupaten Cirebon dan Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi. Perubahan akan diinformasikan melalui portal ini.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
