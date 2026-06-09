'use client';

import Header from '@/components/portal/Header';
import HeroSection from '@/components/portal/HeroSection';
import PublicServiceGrid from '@/components/portal/PublicServiceGrid';
import Announcements from '@/components/portal/Announcements';
import Gallery from '@/components/portal/Gallery';
import Organizations from '@/components/portal/Organizations';
import InstitutionLinks from '@/components/portal/InstitutionLinks';
import Footer from '@/components/portal/Footer';
import { FirebaseLED } from './FirebaseLED';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';

export default function PortalView() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <Header />
      <FirebaseLED />
      <div className="fixed bottom-20 right-4 z-40"><SyncStatusBadge /></div>
      <main className="flex-1 w-full">
        <HeroSection />
        <PublicServiceGrid />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12 md:pb-20">
          <div id="informasi"><Announcements /></div>
          <div id="galeri"><Gallery /></div>
          <div id="organisasi"><Organizations /></div>
          <InstitutionLinks />
        </div>
      </main>
      <div id="kontak"><Footer /></div>
    </div>
  );
}
