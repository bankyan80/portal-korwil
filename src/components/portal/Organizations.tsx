'use client';

import Link from 'next/link';
import { BlueBarHeader } from '@/components/shared/SectionTitle';
import { useDataStore } from '@/store/data-store';

const ORG_COLORS = [
  '#2563eb', '#059669', '#dc2626', '#ea580c',
  '#7c3aed', '#0d9488', '#1d4ed8', '#475569',
];

function getInitials(name: string) {
  const match = name.match(/\(([^)]+)\)/);
  if (match) return match[1].replace(/\s/g, '').slice(0, 3);
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 3).join('').toUpperCase();
}

export default function Organizations() {
  const organizations = useDataStore((s) => s.organizations);
  return (
    <section>
      <div className="rounded-lg shadow-md overflow-hidden">
        <BlueBarHeader title="ORGANISASI PENDIDIKAN" />
        <div className="bg-white px-4 py-6">
          <div className="flex lg:justify-center gap-6 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
            {organizations.filter((o) => o.active).map((org, index) => (
              <Link
                key={org.id}
                href={`/organisasi/${org.id}`}
                className="flex flex-col items-center text-center shrink-0 snap-center min-w-[100px] lg:min-w-0 max-w-[140px] group"
              >
                {org.logo && !org.logo.includes('placehold.co') ? (
                  <img
                    src={org.logo}
                    alt={org.name}
                    className="w-16 h-16 rounded-full shadow-md ring-2 ring-white group-hover:scale-110 transition-transform duration-200 object-cover"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white group-hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: ORG_COLORS[index % ORG_COLORS.length] }}
                  >
                    {getInitials(org.name)}
                  </div>
                )}
                <span className="mt-2 text-[11px] font-semibold text-[#0d3b66] leading-tight max-w-[120px] line-clamp-2 group-hover:underline">
                  {org.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
