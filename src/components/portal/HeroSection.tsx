'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { getDocById } from '@/lib/firestore';
import { mockHeroData } from '@/lib/mock-data';

function GoldCurveTopRight() {
  return (
    <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 opacity-20 pointer-events-none">
      <svg viewBox="0 0 400 400" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M400 0 C400 220, 220 400, 0 400" stroke="#d4af37" strokeWidth="3" fill="none" />
        <path d="M380 0 C380 200, 200 380, 0 380" stroke="#d4af37" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M360 0 C360 180, 180 360, 0 360" stroke="#d4af37" strokeWidth="1" fill="none" opacity="0.3" />
      </svg>
    </div>
  );
}

function GoldCurveBottomLeft() {
  return (
    <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 opacity-15 pointer-events-none">
      <svg viewBox="0 0 300 300" className="w-full h-full" fill="none">
        <path d="M0 300 C0 80, 80 0, 300 0" stroke="#d4af37" strokeWidth="2.5" fill="none" />
        <path d="M0 280 C0 90, 90 0, 280 0" stroke="#d4af37" strokeWidth="1.5" fill="none" opacity="0.5" />
      </svg>
    </div>
  );
}

function PortraitPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="h-full">
      <img
        src={src}
        alt={alt}
        className="h-full w-auto drop-shadow-xl"
      />
    </div>
  );
}

export default function HeroSection() {
  const [hero, setHero] = useState(mockHeroData);

  useEffect(() => {
    if (!db) return;
    getDocById('settings', 'profile').then(data => {
      if (data) {
        setHero({
          name: data.kepalaDinas || data.name || mockHeroData.name,
          title: data.jabatan || data.title || mockHeroData.title,
          greeting: data.sambutan || data.greeting || mockHeroData.greeting,
          photoURL: data.fotoKepalaDinas || data.photoURL || mockHeroData.photoURL,
        });
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="w-full relative overflow-hidden" aria-label="Selamat Datang">
      <div
        className="w-full py-0 relative"
        style={{ background: 'linear-gradient(135deg, #e6f2ff 0%, #f0f7ff 30%, #ffffff 70%, #ffffff 100%)' }}
      >
        <GoldCurveTopRight />
        <GoldCurveBottomLeft />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col-reverse md:flex-row items-stretch">
            <PortraitPhoto src={hero.photoURL} alt={hero.name} />
            <div className="flex-1 text-center md:text-left relative z-10 flex flex-col justify-center gap-2 md:gap-3">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl font-serif italic" style={{ color: '#d4af37' }}>
                {hero.greeting.split('.')[0]}.
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight" style={{ color: '#0d3b66' }}>
                DINAS PENDIDIKAN
              </h2>
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold" style={{ color: '#0d3b66' }}>
                PORTAL TIM KERJA KECAMATAN LEMAHABANG
              </h3>
              <div className="flex items-center gap-3">
                <div className="h-0.5 flex-1 max-w-[60px]" style={{ backgroundColor: '#d4af37' }} />
                <div className="w-2.5 h-2.5 rounded-full rotate-45" style={{ backgroundColor: '#d4af37' }} />
                <div className="h-0.5 flex-1 max-w-[60px]" style={{ backgroundColor: '#d4af37' }} />
              </div>
              <blockquote className="text-xs sm:text-sm md:text-base text-gray-600 italic leading-relaxed max-w-xl mx-auto md:mx-0">
                &ldquo;DISDIK BERBENAH (Bersih, Edukatif, Religius, Berintegritas, Empati, Normatif, Amanah, Humanis)&rdquo;
              </blockquote>
              <div className="space-y-0.5">
                <p className="text-sm sm:text-base md:text-lg font-bold" style={{ color: '#0d3b66' }}>
                  {hero.name}
                </p>
                <p className="text-xs sm:text-sm" style={{ color: '#0d3b66', opacity: 0.8 }}>
                  {hero.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
