'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetTKGelatikPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleReset() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/reset-tk-gelatik', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Gagal reset data');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/super')} className="p-2 rounded-lg hover:bg-gray-200">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-bold">Reset Data TK Gelatik</h1>
        </div>

        <p className="text-sm text-gray-600">
          Hapus semua data pegawai TK Gelatik di Firestore, lalu impor ulang dari Google Sheets.
        </p>

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Memproses...' : 'Reset & Impor Ulang'}
        </button>

        {result && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold">Berhasil</span>
            </div>
            <div className="bg-green-50 rounded-lg p-3 space-y-1">
              <p>Dihapus: <strong>{result.deleted}</strong> record</p>
              <p>Diimpor: <strong>{result.imported}</strong> record</p>
              <p className="text-xs text-gray-500">Guru: {result.guru} | Tendik: {result.tendik}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
