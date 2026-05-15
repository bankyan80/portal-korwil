'use client';

import { useRef } from 'react';
import { BlueBarHeader } from '@/components/shared/SectionTitle';
import { ExternalLink } from 'lucide-react';
import { useDataStore } from '@/store/data-store';

const LINK_COLORS = [
  '#2563eb', '#059669', '#dc2626', '#ea580c',
  '#7c3aed', '#0d9488', '#1d4ed8', '#475569',
];

function getInitials(name: string) {
  return name.split(' ').filter((w) => w.length > 2).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function InstitutionLinks() {
  const links = useDataStore((s) => s.institutionLinks);
  const imgErrors = useRef(new Set<string>());

  return (
    <section>
      <div className="rounded-lg shadow-md overflow-hidden">
        <BlueBarHeader title="LINK INSTANSI TERKAIT" />
        <div className="bg-white px-4 py-6">
          <div className="flex lg:justify-center gap-6 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
            {links.filter((l) => l.active).sort((a, b) => a.order - b.order).map((link, index) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center text-center shrink-0 snap-center min-w-[80px] lg:min-w-0 group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center bg-white shadow-md border hover:scale-110 transition-transform duration-200 relative overflow-hidden"
                >
                  {link.logo && !imgErrors.current.has(link.id) ? (
                    <img
                      src={link.logo}
                      alt={link.name}
                      className="w-8 h-8 object-contain"
                      onError={() => imgErrors.current.add(link.id)}
                    />
                  ) : (
                    <span
                      className="text-white text-xs font-bold w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: LINK_COLORS[index % LINK_COLORS.length] }}
                    >
                      {getInitials(link.name)}
                    </span>
                  )}
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white shadow flex items-center justify-center">
                    <ExternalLink className="w-2.5 h-2.5 text-gray-500" />
                  </span>
                </div>
                <span className="mt-2 text-xs font-medium text-[#0d3b66] leading-tight max-w-[80px] group-hover:underline">
                  {link.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
