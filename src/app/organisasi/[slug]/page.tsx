'use client';

import { ArrowLeft, Users, Phone, Building2, Target, ChevronRight, BadgeCheck } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useDataStore } from '@/store/data-store';
import Footer from '@/components/portal/Footer';

export default function OrganisasiDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const org = useDataStore((s) => s.organizations.find((o) => o.id === slug));

  if (!org) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <a href="/#organisasi" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Kembali</span>
              </a>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-yellow-400" />
                <h1 className="text-sm font-bold text-white uppercase tracking-wide">Organisasi</h1>
              </div>
              <div />
            </div>
          </div>
        </header>
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Organisasi tidak ditemukan</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/#organisasi" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">{org.name}</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
          <div className="flex items-start gap-4 sm:gap-6">
            {org.logo && (
              <img src={org.logo} alt={org.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0d3b66]">{org.name}</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Ketua: <strong>{org.leader}</strong></span>
                </div>
                {org.contact && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-green-600" />
                    <span>{org.contact}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {org.description && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
            <h3 className="text-lg font-bold text-[#0d3b66] mb-3">Tentang</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{org.description}</p>
          </div>
        )}

        {org.vision && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-[#0d3b66]" />
              <h3 className="text-lg font-bold text-[#0d3b66]">Visi</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{org.vision}&rdquo;</p>
          </div>
        )}

        {org.mission && org.mission.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-[#0d3b66]" />
              <h3 className="text-lg font-bold text-[#0d3b66]">Misi</h3>
            </div>
            <ul className="space-y-3">
              {org.mission.map((m, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <ChevronRight className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {org.board && org.board.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 pb-0">
              <div className="flex items-center gap-3 mb-4">
                <BadgeCheck className="w-6 h-6 text-[#0d3b66]" />
                <h3 className="text-lg font-bold text-[#0d3b66]">Kepengurusan</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-gray-600 w-12">No</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Jabatan</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-600">Nama</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {org.board.map((member, i) => (
                    <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-6 py-3 font-medium text-gray-700">{member.jabatan}</td>
                      <td className="px-6 py-3 text-gray-600">{member.nama}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!org.description && !org.vision && (!org.mission || org.mission.length === 0) && (!org.board || org.board.length === 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <Building2 className="w-12 h-12 text-blue-300 mx-auto mb-3" />
            <p className="text-sm text-blue-700">Belum ada informasi detail untuk organisasi ini.</p>
            <p className="text-xs text-blue-500 mt-1">Admin dapat menambahkan deskripsi, visi, misi, dan kepengurusan melalui panel admin.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
