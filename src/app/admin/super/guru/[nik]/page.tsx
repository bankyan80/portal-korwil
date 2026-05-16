'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import {
  Shield, LogOut, Loader2, ArrowLeft, User, BookOpen,
  BadgeCheck, Calendar, Building2, Hash, FileText, Clock,
  AlertTriangle, CheckCircle, XCircle, GraduationCap, MapPin,
  Phone, Mail, Users,
} from 'lucide-react';

export default function GuruDetailPage() {
  const { user, setUser } = useAppStore();
  const router = useRouter();
  const params = useParams();
  const nik = params?.nik as string;

  const [pegawai, setPegawai] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin' && user.role !== 'operator_sekolah') { router.push('/login'); return; }
    if (nik) fetchDetail();
  }, [user, router, nik]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pegawai/detail?nik=${nik}`);
      const json = await res.json();
      if (json.found) {
        setPegawai(json.pegawai);
      } else {
        setError(json.error || 'Data tidak ditemukan');
      }
    } catch (e) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (auth) auth.signOut();
    setUser(null);
    router.push('/');
  }

  if (!user) return null;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (error || !pegawai) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">{error || 'Pegawai tidak ditemukan'}</p>
        <button onClick={() => router.push('/admin/super')} className="text-sm text-blue-600 hover:underline">Kembali ke Dashboard</button>
      </div>
    );
  }

  const infoRows = [
    { label: 'Nama Lengkap', value: pegawai.nama, icon: User },
    { label: 'NIK', value: pegawai.nik, icon: Hash },
    { label: 'NUPTK', value: pegawai.nuptk || '-', icon: Hash },
    { label: 'NIP', value: pegawai.nip || '-', icon: FileText },
    { label: 'Jenis Kelamin', value: pegawai.jk === 'L' ? 'Laki-laki' : 'Perempuan', icon: Users },
    { label: 'Tempat / Tgl Lahir', value: pegawai.tanggal_lahir || '-', icon: Calendar },
    { label: 'Usia', value: `${pegawai.usia} tahun`, icon: Clock },
    { label: 'Sekolah', value: pegawai.sekolah || '-', icon: Building2 },
    { label: 'Jenis PTK', value: pegawai.jenis_ptk || '-', icon: GraduationCap },
    { label: 'Tugas Tambahan', value: pegawai.tugas_tambahan || 'Tidak ada', icon: BookOpen },
    { label: 'Status Kepegawaian', value: pegawai.status_kepegawaian || '-', icon: FileText },
    { label: 'Sertifikasi', value: pegawai.sertifikasi || 'Tidak ada', icon: BadgeCheck },
    { label: 'Masa Kerja', value: pegawai.masaKerja ? `${pegawai.masaKerja} tahun` : '-', icon: Clock },
    { label: 'Status BUP', value: pegawai.statusBup || '-', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5" /> Profil Guru
            </h1>
            <p className="text-sm text-blue-200">{pegawai.nama}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'super_admin' && (
            <>
              <button onClick={() => router.push('/admin/super')} className="text-sm text-blue-300 hover:text-blue-200">Dashboard</button>
              <button onClick={() => router.push('/admin/super/validator')} className="text-sm text-blue-300 hover:text-blue-200">Validasi</button>
            </>
          )}
          {user.role === 'operator_sekolah' && (
            <button onClick={() => router.push('/admin/operator')} className="text-sm text-blue-300 hover:text-blue-200">Dashboard</button>
          )}
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        {/* BUP Warning */}
        {pegawai.isBup && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Batas Usia Pensiun (BUP) Terlampaui</p>
              <p className="text-xs text-red-700">Status PNS dengan BUP {pegawai.bupDate}. Sudah melewati batas usia pensiun.</p>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{pegawai.nama}</h2>
                <p className="text-sm text-blue-200">{pegawai.jenis_ptk} • {pegawai.sekolah}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {infoRows.map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <row.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">{row.label}</p>
                    <p className="text-sm font-medium text-gray-900 break-words">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sertification Status Card */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-amber-600" /> Status Sertifikasi
          </h3>
          <div className="flex items-start gap-3">
            {pegawai.sertifikasi ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Tersertifikasi</p>
                  <p className="text-xs text-gray-600">Mapel: {pegawai.sertifikasi}</p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Belum Sertifikasi</p>
                  <p className="text-xs text-gray-500">Belum memiliki sertifikasi pendidik</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* BUP Info Card */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Informasi BUP
          </h3>
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 shrink-0 mt-0.5 ${pegawai.isBup ? 'text-red-500' : 'text-green-600'}`}>
              {pegawai.isBup ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${pegawai.isBup ? 'text-red-700' : 'text-green-700'}`}>
                {pegawai.statusBup}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {pegawai.isBup
                  ? 'Guru ini sudah melewati Batas Usia Pensiun. Perlu diperhatikan untuk proses mutasi/penggantian.'
                  : 'Guru ini masih dalam batas usia produktif.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100">
            Kembali
          </button>
          <button onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100">
            Cetak Profil
          </button>
        </div>
      </main>
    </div>
  );
}
