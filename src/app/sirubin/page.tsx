'use client';

import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Loader2, Search, CheckCircle, XCircle } from 'lucide-react';

export default function SirubinPublicPage() {
  const [data, setData] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const bulanList = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

  const schoolStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of schools) map[s.id] = s.statusSekolah;
    return map;
  }, [schools]);

  useEffect(() => {
    Promise.all([
      fetch('/api/firestore/sirubin_reports?limit=10000').then(r => r.json()),
      fetch('/api/firestore/schools').then(r => r.json()),
    ])
      .then(([sJson, scJson]) => {
        if (sJson.items) setData(sJson.items);
        if (scJson.items) setSchools(scJson.items);
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = data.filter(d => d.bulan === bulan && d.tahun === tahun);
    if (filterJenjang !== 'Semua') result = result.filter(d => d.jenjang === filterJenjang);
    if (filterStatus !== 'Semua') result = result.filter(d => schoolStatusMap[d.schoolId] === filterStatus);
    return result;
  }, [data, filterJenjang, filterStatus, bulan, tahun, schoolStatusMap]);

  const sudahKirim = filtered.filter(d => d.statusLaporan === 'Terkirim' || d.statusLaporan === 'Valid' || d.statusLaporan === 'Terkunci');
  const belumKirim = filtered.filter(d => d.statusLaporan === 'Belum Dibuat' || d.statusLaporan === 'Draft');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Memuat data SIRUBIN...</span></div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-red-600">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-6 h-6 text-blue-200" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">SIRUBIN</h1>
          </div>
          <p className="text-sm text-blue-200">Sistem Rutin Bulanan — Laporan Bulanan Sekolah/Lembaga</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={bulan} onChange={e => setBulan(Number(e.target.value))} className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
            {bulanList.map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
          </select>
          <select value={tahun} onChange={e => setTahun(Number(e.target.value))} className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
            {[2024, 2025, 2026].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterJenjang} onChange={e => setFilterJenjang(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
            <option value="Semua">Semua Jenjang</option>
            <option value="SD">SD</option>
            <option value="TK">TK</option>
            <option value="KB">KB</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800">
            <option value="Semua">Negeri/Swasta</option>
            <option value="Negeri">Negeri</option>
            <option value="Swasta">Swasta</option>
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-gray-900">{filtered.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-green-700">{sudahKirim.length}</p><p className="text-xs text-muted-foreground">Sudah Kirim</p></div>
          <div className="bg-white rounded-xl border p-4 text-center"><p className="text-2xl font-bold text-red-700">{belumKirim.length}</p><p className="text-xs text-muted-foreground">Belum Kirim</p></div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{filtered.length ? Math.round((sudahKirim.length / filtered.length) * 100) : 0}%</p>
            <p className="text-xs text-muted-foreground">Progres</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
            <h3 className="font-semibold text-sm">Progres Laporan {bulanList[bulan - 1]} {tahun}</h3>
          </div>
          <div className="divide-y text-sm">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground">Belum ada data laporan</div>
            ) : (
              filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    {r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : r.statusLaporan === 'Terkirim' ? (
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">{r.namaSekolah || r.sekolah || '-'}</p>
                      <p className="text-xs text-muted-foreground">{r.jenjang} • {r.statusSekolah}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.statusLaporan === 'Valid' || r.statusLaporan === 'Terkunci' ? 'bg-green-100 text-green-700' :
                    r.statusLaporan === 'Terkirim' ? 'bg-blue-100 text-blue-700' :
                    r.statusLaporan === 'Perlu Perbaikan' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {r.statusLaporan === 'Belum Dibuat' ? 'Belum Mengirim' :
                     r.statusLaporan === 'Terkirim' ? 'Terkirim' :
                     r.statusLaporan === 'Valid' ? 'Valid' :
                     r.statusLaporan === 'Terkunci' ? 'Valid' :
                     r.statusLaporan === 'Perlu Perbaikan' ? 'Perlu Perbaikan' :
                     r.statusLaporan || 'Belum Dibuat'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
