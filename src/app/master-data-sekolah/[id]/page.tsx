'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, School, MapPin, Users, BookOpen, UserCheck, Building2, Loader2, Phone, Mail } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface SchoolDetail {
  id: string;
  namaSekolah: string;
  npsn: string;
  jenjang: string;
  statusSekolah: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  akreditasi: string;
  jumlahRombel: number;
  jumlahSiswa: number;
  jumlahGuru: number;
  jumlahTendik: number;
  email: string;
  telepon: string;
  alamat: string;
  website: string;
  isActive: boolean;
}

export default function SekolahDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/firestore/schools?id=${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.exists && json.data) setData(json.data as SchoolDetail);
        else setError('Data sekolah tidak ditemukan');
      })
      .catch(() => setError('Gagal memuat data sekolah'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Memuat data sekolah...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <Link href="/master-data-sekolah" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center">
          <School className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{error || 'Sekolah tidak ditemukan'}</p>
          <Link href="/master-data-sekolah" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            Kembali ke daftar sekolah
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/master-data-sekolah" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Kembali</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <School className="w-7 h-7 text-blue-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#0d3b66]">{data.namaSekolah}</h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  data.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' :
                  data.jenjang === 'TK' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                }`}>{data.jenjang}</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  data.statusSekolah === 'Negeri' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>{data.statusSekolah}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">NPSN: {data.npsn}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#0d3b66] mb-4">Informasi Umum</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={MapPin} label="Alamat" value={data.alamat || `${data.desa}, ${data.kecamatan}`} />
            <InfoItem icon={MapPin} label="Desa/Kelurahan" value={data.desa} />
            <InfoItem icon={MapPin} label="Kecamatan" value={data.kecamatan} />
            <InfoItem icon={MapPin} label="Kabupaten/Kota" value={data.kabupaten || 'Cirebon'} />
            <InfoItem icon={MapPin} label="Provinsi" value={data.provinsi || 'Jawa Barat'} />
            {data.telepon && <InfoItem icon={Phone} label="Telepon" value={data.telepon} />}
            {data.email && <InfoItem icon={Mail} label="Email" value={data.email} />}
            {data.website && <InfoItem icon={Building2} label="Website" value={data.website} />}
            {data.akreditasi && <InfoItem icon={BadgeCheckIcon} label="Akreditasi" value={data.akreditasi} />}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#0d3b66] mb-4">Kepala Sekolah</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{data.kepalaSekolah || '-'}</p>
              {data.nipKepalaSekolah && (
                <p className="text-sm text-gray-500">NIP: {data.nipKepalaSekolah}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#0d3b66] mb-4">Data Satuan Pendidikan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} label="Rombel" value={data.jumlahRombel ?? 0} color="blue" />
            <StatCard icon={Users} label="Siswa" value={data.jumlahSiswa ?? 0} color="green" />
            <StatCard icon={Users} label="Guru" value={data.jumlahGuru ?? 0} color="purple" />
            <StatCard icon={Users} label="Tendik" value={data.jumlahTendik ?? 0} color="amber" />
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value || '-'}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mx-auto mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function BadgeCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
