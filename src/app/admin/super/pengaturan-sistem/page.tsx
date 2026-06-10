'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { Settings, LogOut, ArrowLeft, Database, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SuperPengaturanSistem() {
  const { user } = useAppStore();
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/firestore/system_settings?id=default_settings')
      .then(r => r.json())
      .then(json => { if (json.data) setSettings(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSeed = async () => {
    if (!confirm('Seed data akan mengisi sekolah dan mapping pegawai. Lanjutkan?')) return;
    setSeeding(true);
    setSeedMessage('');
    try {
      const res = await fetch('/api/admin/seed-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      setSeedMessage(json.message || (json.success ? 'Selesai' : 'Gagal'));
      if (json.results) {
        const parts = Object.entries(json.results).map(([k, v]: [string, any]) => `${k}: ${v.success} ok, ${v.errors} error`);
        setSeedMessage(parts.join(' | '));
      }
    } catch (e) {
      setSeedMessage('Gagal: ' + String(e));
    } finally {
      setSeeding(false);
    }
  };

  if (!user) return null;

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Pengaturan Sistem">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="w-5 h-5" /> Pengaturan Sistem</h1><p className="text-sm text-blue-200">{user.displayName || ''}</p></div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"><ArrowLeft className="w-4 h-4" /> Kembali</button>
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>
      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Database className="w-5 h-5" /> Data & Seed</h2>
          <p className="text-sm text-muted-foreground mb-4">Seed data sekolah dari data statis 45 SD/TK/KB.</p>
          <button onClick={handleSeed} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
            {seeding && <Loader2 className="w-4 h-4 animate-spin" />}
            <Database className="w-4 h-4" />
            {seeding ? 'Proses...' : 'Seed Data Sekolah'}
          </button>
          {seedMessage && (
            <p className="mt-3 text-sm text-green-700">{seedMessage}</p>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><RefreshCw className="w-5 h-5" /> Sinkronisasi Data</h2>
          <p className="text-sm text-muted-foreground mb-4">Sinkronkan relasi pegawai & siswa ke sekolah, identifikasi kepala sekolah dan plt. kepala sekolah, regenerate mapping pegawai.</p>
          <button onClick={async () => {
            if (!confirm('Sinkronisasi data pegawai, siswa, dan mapping? Lanjutkan?')) return;
            setSyncing(true);
            setSyncLog([]);
            try {
              const res = await fetch('/api/admin/sync-data', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
              const json = await res.json();
              setSyncLog(json.log || [json.message || (json.success ? 'Selesai' : 'Gagal')]);
            } catch (e) {
              setSyncLog(['Gagal: ' + String(e)]);
            } finally {
              setSyncing(false);
            }
          }} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50">
            {syncing && <Loader2 className="w-4 h-4 animate-spin" />}
            <RefreshCw className="w-4 h-4" />
            {syncing ? 'Menyinkronkan...' : 'Sinkronisasi'}
          </button>
          {syncLog.length > 0 && (
            <div className="mt-3 space-y-1">
              {syncLog.map((msg, i) => (
                <p key={i} className="text-sm text-green-700">{msg}</p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-lg mb-4">Konfigurasi Aplikasi</h2>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : settings ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Nama App:</span> <span className="font-medium">{settings.appName || '-'}</span></div>
              <div><span className="text-muted-foreground">Periode Aktif:</span> <span className="font-medium">{settings.periodeAktif || '-'}</span></div>
              <div><span className="text-muted-foreground">Batas Lapor:</span> <span className="font-medium">{settings.batasLaporBulanan || '-'} tiap bulan</span></div>
              <div><span className="text-muted-foreground">Maintenance:</span> <span className="font-medium">{settings.maintenanceMode ? 'Ya' : 'Tidak'}</span></div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada konfigurasi.</p>
          )}
        </div>
      </main>
    </div>
    </AuthGuard>
  );
}
