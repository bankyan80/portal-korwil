'use client';

import Header from '@/components/portal/Header';
import HeroSection from '@/components/portal/HeroSection';
import MenuGrid from '@/components/portal/MenuGrid';
import Announcements from '@/components/portal/Announcements';
import Gallery from '@/components/portal/Gallery';
import Organizations from '@/components/portal/Organizations';
import InstitutionLinks from '@/components/portal/InstitutionLinks';
import Footer from '@/components/portal/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { FirebaseLED } from './FirebaseLED';

export default function PortalView() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <Header />
      <FirebaseLED />
      <main className="flex-1 w-full">
        <HeroSection />
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12 md:pb-20">
          <MenuGrid />
          <div id="informasi"><Announcements /></div>
          <div id="galeri"><Gallery /></div>
          <div id="organisasi"><Organizations /></div>
          <InstitutionLinks />
        </div>
      </main>
      <div id="kontak"><Footer /></div>
      <MobileBottomNav />
    </div>
  );
}
