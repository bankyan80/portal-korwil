'use client';

import { ArrowLeft, HeartHandshake, Heart, Smartphone, Copy, CheckCircle } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { useState } from 'react';

export default function DonasiPage() {
  const [copied, setCopied] = useState(false);

  const copyDana = async () => {
    try {
      await navigator.clipboard.writeText('081321592990');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error('Error copying to clipboard:', e); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Donasi</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Donasi</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Donasi Anak Yatim & Piatu</h3>
                <p className="text-sm text-red-100">Kecamatan Lemahabang</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-lg font-bold text-red-600">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Donasi di Sekolah Masing-Masing</h4>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Donasi dapat disalurkan langsung melalui sekolah masing-masing. 
                  Koordinasikan dengan pihak sekolah untuk penyaluran donasi 
                  bagi anak yatim dan piatu di lingkungan sekolah.
                </p>
              </div>
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-lg font-bold text-red-600">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Kepanitiaan Donasi Yatim-Piatu</h4>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Donasi juga dapat disalurkan melalui Kepanitiaan Donasi Yatim-Piatu 
                  yang bertempat di <strong>SD Negeri 1 Cipeujeuh Wetan</strong>. 
                  Silakan datang langsung ke sekolah untuk berdonasi atau 
                  menghubungi panitia untuk informasi lebih lanjut.
                </p>
                <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm font-medium text-red-800">
                    📍 SD Negeri 1 Cipeujeuh Wetan
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Kecamatan Lemahabang, Kabupaten Cirebon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Donasi Pengembangan Aplikasi</h3>
                <p className="text-sm text-blue-100">Portal Pendidikan Kecamatan Lemahabang</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Dukung pengembangan dan pemeliharaan Portal Pendidikan Kecamatan Lemahabang 
              agar semakin baik dan bermanfaat bagi kita semua. Donasi dapat disalurkan melalui:
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">DANA</p>
                  <p className="text-xs text-gray-500">Transfer / Top Up</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg border p-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Nomor DANA</p>
                  <p className="text-xl font-bold text-gray-900 tracking-wider">0813 2159 2990</p>
                </div>
                <button onClick={copyDana}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  {copied ? (
                    <><CheckCircle className="w-4 h-4" /> Tersalin</>
                  ) : (
                    <><Copy className="w-4 h-4" /> Salin</>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">a.n. Pengembang Portal Pendidikan Kecamatan Lemahabang</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-800 mb-1">Informasi</h3>
          <p className="text-sm text-amber-700 leading-relaxed">
            Seluruh donasi yang terkumpul akan digunakan sesuai dengan peruntukannya 
            dan dikelola secara transparan. Terima kasih atas partisipasi dan 
            kepedulian Bapak/Ibu/Saudara/i. Semoga menjadi amal ibadah dan 
            keberkahan bagi kita semua.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
