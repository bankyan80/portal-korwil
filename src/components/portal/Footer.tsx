'use client';

import { useEffect, useState } from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { mockFooterData } from '@/lib/mock-data';

const socialLinks = [
  { name: 'Facebook', letter: 'F', bgClass: 'bg-[#1877F2]', href: 'https://facebook.com' },
  { name: 'YouTube', letter: 'Y', bgClass: 'bg-[#FF0000]', href: 'https://youtube.com' },
  { name: 'Instagram', letter: 'I', bgClass: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]', href: 'https://instagram.com' },
  { name: 'WhatsApp', letter: 'W', bgClass: 'bg-[#25D366]', href: 'https://wa.me/6281321592990' },
];

export default function Footer() {
  const [footer, setFooter] = useState(mockFooterData);

  useEffect(() => {
    if (!db) return;

    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'profile'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setFooter({
            address: data.alamat || data.address || mockFooterData.address,
            email: data.email || mockFooterData.email,
            phone: data.telepon || data.phone || mockFooterData.phone,
          });
        }
      },
      (err) => {
        console.error('Error in settings/profile realtime listener:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <footer className="mt-auto bg-[#0d3b66] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/portalnew.png" alt="Portal Pendidikan" className="w-14 h-14 object-contain drop-shadow-lg" />
              <div>
                <h3 className="text-base font-bold leading-tight text-white">Portal Pendidikan</h3>
                <p className="text-xs text-yellow-400 font-semibold">Kecamatan Lemahabang</p>
              </div>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed mb-4">
              Sistem informasi pendidikan yang menyediakan data dan layanan
              bagi para pemangku kepentingan pendidikan di Kecamatan Lemahabang,
              Kabupaten Cirebon, Jawa Barat.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs border border-white/30">KC</div>
              <div className="w-10 h-10 rounded-full bg-yellow-500/90 flex items-center justify-center text-[#0d3b66] font-bold text-xs border border-yellow-400/40">TKL</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-5 text-yellow-400">Kontak Kami</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-sm text-blue-100 leading-relaxed">{footer.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-yellow-400" />
                </div>
                <a href={`mailto:${footer.email}`} className="text-sm text-blue-100 hover:text-yellow-400 transition-colors">
                  {footer.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-4 h-4 text-yellow-400" />
                </div>
                <a href={`tel:${footer.phone}`} className="text-sm text-blue-100 hover:text-yellow-400 transition-colors">
                  {footer.phone}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-5 text-yellow-400">Ikuti Kami</h4>
            <p className="text-sm text-blue-200 leading-relaxed mb-5">
              Dapatkan informasi terbaru melalui media sosial resmi kami.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg hover:scale-110 transition-transform duration-200 hover:shadow-xl"
                  title={social.name}
                >
                  <span className={`${social.bgClass} w-10 h-10 rounded-full flex items-center justify-center`}>
                    {social.letter}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-blue-300">
            &copy; 2026 Portal Pendidikan Tim Kerja Kecamatan Lemahabang. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
