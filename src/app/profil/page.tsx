'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { getDocById } from '@/lib/firestore';
import { ArrowLeft, Loader2, MapPin, Mail, Phone } from 'lucide-react';

export default function ProfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    async function fetchProfile() {
      try {
        const data = await getDocById('settings', 'profile');
        if (data) setProfile(data);
      } catch {} finally { setLoading(false); }
    }
    fetchProfile();
  }, []);

  if (loading) return <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900"><header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex items-center justify-between py-3"><a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /><span className="text-sm font-medium">Kembali</span></a><div className="flex items-center gap-2"><h1 className="text-sm font-bold text-white uppercase tracking-wide">Profil</h1></div><div /></div></div></header><div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div></div>;

  const p = profile || {};

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Profil</h1>
            </div>
            <div />
          </div>
        </div>
      </header>
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil</h1>
          <p className="text-sm text-muted-foreground">Portal Pendidikan Kecamatan Lemahabang</p>
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Tentang Portal</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {p.tentang || 'Portal Pendidikan Kecamatan Lemahabang adalah sistem informasi terintegrasi untuk pengelolaan data pendidikan di lingkungan Kecamatan Lemahabang, Kabupaten Cirebon. Portal ini dikelola oleh Tim Kerja Kecamatan Lemahabang Dinas Pendidikan Kabupaten Cirebon.'}
          </p>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Visi dan Misi</h2>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">Visi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {p.visi || 'Terwujudnya pendidikan yang berkualitas, merata, dan berkeadilan di Kecamatan Lemahabang.'}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white text-sm">Misi</h3>
            <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-1">
              {(p.misi && Array.isArray(p.misi) ? p.misi : [
                'Meningkatkan kualitas tenaga pendidik dan kependidikan',
                'Mengoptimalkan pengelolaan data pendidikan berbasis teknologi',
                'Meningkatkan partisipasi masyarakat dalam pendidikan',
                'Mewujudkan transparansi dan akuntabilitas pendidikan',
              ]).map((m: string, i: number) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Kontak</h2>
          <div className="text-sm text-muted-foreground space-y-3">
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {p.alamat || 'Kantor Kecamatan Lemahabang, Kabupaten Cirebon'}</p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {p.email || 'portal@lemahabang.sch.id'}</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {p.telepon || '(0231) xxx-xxxx'}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
