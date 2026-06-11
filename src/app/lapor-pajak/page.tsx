'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, Search, Receipt, CheckCircle2, XCircle, AlertTriangle, Download } from 'lucide-react';
import { exportToExcel } from '@/components/laporan/ExportButton';

interface LaporPajak {
  id: string;
  triwulan: string;
  npsn: string;
  namaSekolah: string;
  statusSekolah: string;
  kecamatan: string;
  pajakBelumSetor: { ppn: number; pph21: number; pph23: number; nilaiKeseluruhan: number };
  pajakSudahSetor: { ppn: number; pph21: number; pph23: number; nilaiKeseluruhan: number };
  keterangan: string;
  createdAt: number;
}

interface School {
  id: string;
  npsn: string;
  namaSekolah: string;
  statusSekolah: string;
  kecamatan: string;
  jenjang: string;
}

const TRIMULAN = ['1', '2', '3', '4'];
const KETERANGAN = [
  { value: 'sudah_bayar', label: 'Sudah Bayar' },
  { value: 'kurang_bayar', label: 'Kurang Bayar' },
  { value: 'lebih_bayar', label: 'Lebih Bayar' },
];

function currency(n: number) {
  return new Intl.NumberFormat('id-ID').format(n || 0);
}

export default function LaporPajakPage() {
  const [data, setData] = useState<LaporPajak[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterTriwulan, setFilterTriwulan] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTriwulan, setFormTriwulan] = useState('');
  const [formNpsn, setFormNpsn] = useState('');
  const [formNamaSekolah, setFormNamaSekolah] = useState('');
  const [formStatus, setFormStatus] = useState('');
  const [formKecamatan, setFormKecamatan] = useState('');
  const [formBlmPpn, setFormBlmPpn] = useState(0);
  const [formBlmPph21, setFormBlmPph21] = useState(0);
  const [formBlmPph23, setFormBlmPph23] = useState(0);
  const [formSdhPpn, setFormSdhPpn] = useState(0);
  const [formSdhPph21, setFormSdhPph21] = useState(0);
  const [formSdhPph23, setFormSdhPph23] = useState(0);
  const [formKeterangan, setFormKeterangan] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/firestore/lapor_pajak?limit=10000').then(r => r.json()),
      fetch('/api/firestore/schools').then(r => r.json()),
    ])
      .then(([pj, sc]) => {
        if (pj.items) setData(pj.items as LaporPajak[]);
        if (sc.items) setSchools(sc.items as School[]);
      })
      .catch(() => setError('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  const schoolsSD = useMemo(() => schools.filter(s => s.jenjang === 'SD'), [schools]);

  const sekolahMap = useMemo(() => {
    const m = new Map<string, School>();
    for (const s of schoolsSD) m.set(s.npsn, s);
    return m;
  }, [schoolsSD]);

  const laporanBySekolah = useMemo(() => {
    const m = new Map<string, LaporPajak[]>();
    for (const d of data) {
      const key = d.npsn;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(d);
    }
    return m;
  }, [data]);

  const sekolahSudahLapor = useMemo(() => {
    const sudah = new Set<string>();
    for (const d of data) sudah.add(d.npsn);
    const belum = schoolsSD.filter(s => !sudah.has(s.npsn));
    const sudahArr = schoolsSD.filter(s => sudah.has(s.npsn));
    return { sudah: sudahArr, belum };
  }, [data, schoolsSD]);

  useEffect(() => {
    if (!formNpsn) return;
    const s = sekolahMap.get(formNpsn);
    if (s) {
      setFormNamaSekolah(s.namaSekolah || '');
      setFormStatus(s.statusSekolah || '');
      setFormKecamatan(s.kecamatan || 'Kecamatan Lemahabang');
    } else {
      setFormNamaSekolah('');
      setFormStatus('');
      setFormKecamatan('');
    }
  }, [formNpsn, sekolahMap]);

  const nilaiBlm = useMemo(() => formBlmPpn + formBlmPph21 + formBlmPph23, [formBlmPpn, formBlmPph21, formBlmPph23]);
  const nilaiSdh = useMemo(() => formSdhPpn + formSdhPph21 + formSdhPph23, [formSdhPpn, formSdhPph21, formSdhPph23]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTriwulan || !formNpsn || !formKeterangan) return;
    setSubmitting(true);
    try {
      const body = {
        triwulan: formTriwulan,
        npsn: formNpsn,
        namaSekolah: formNamaSekolah,
        statusSekolah: formStatus,
        kecamatan: formKecamatan,
        pajakBelumSetor: { ppn: formBlmPpn, pph21: formBlmPph21, pph23: formBlmPph23, nilaiKeseluruhan: nilaiBlm },
        pajakSudahSetor: { ppn: formSdhPpn, pph21: formSdhPph21, pph23: formSdhPph23, nilaiKeseluruhan: nilaiSdh },
        keterangan: formKeterangan,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const res = await fetch('/api/firestore/lapor_pajak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: body }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(prev => [{ id: json.id, ...body }, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (e: any) {
      alert('Gagal: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setFormTriwulan('');
    setFormNpsn('');
    setFormNamaSekolah('');
    setFormStatus('');
    setFormKecamatan('');
    setFormBlmPpn(0);
    setFormBlmPph21(0);
    setFormBlmPph23(0);
    setFormSdhPpn(0);
    setFormSdhPph21(0);
    setFormSdhPph23(0);
    setFormKeterangan('');
  }

  const filtered = useMemo(() => {
    let result = data;
    if (filterTriwulan !== 'Semua') result = result.filter(d => d.triwulan === filterTriwulan);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.namaSekolah?.toLowerCase().includes(q) ||
        d.npsn?.includes(q)
      );
    }
    return result;
  }, [data, filterTriwulan, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Memuat data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-sm text-blue-600 hover:underline">Coba lagi</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-blue-100">
            <Receipt className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lapor Pajak</h1>
            <p className="text-sm text-gray-500">Pelaporan pajak per triwulan SD Kecamatan Lemahabang</p>
          </div>
        </div>

        {/* Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><CheckCircle2 className="w-5 h-5 text-green-700" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sekolahSudahLapor.sudah.length}</p>
                <p className="text-xs text-gray-500">Sekolah Sudah Lapor</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100"><XCircle className="w-5 h-5 text-red-700" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sekolahSudahLapor.belum.length}</p>
                <p className="text-xs text-gray-500">Sekolah Belum Lapor</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><Receipt className="w-5 h-5 text-blue-700" /></div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                <p className="text-xs text-gray-500">Total Laporan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Lapor */}
        <div className="mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Lapor Pajak
          </button>
        </div>

        {/* Daftar Sekolah Sudah/Belum Lapor */}
        <div className="bg-white rounded-xl border mb-6">
          <div className="p-4 sm:p-5 border-b">
            <h2 className="font-semibold text-gray-900">Progres Daftar Sekolah yang Sudah dan Belum Lapor</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Sekolah</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {schoolsSD.map(s => {
                  const laporan = laporanBySekolah.get(s.npsn) || [];
                  const sudahLapor = laporan.length > 0;
                  const triwulanList = [...new Set(laporan.map(l => l.triwulan))].sort();
                  return (
                    <tr key={s.npsn} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{s.namaSekolah}</div>
                        <div className="text-xs text-gray-400">{s.npsn}</div>
                      </td>
                      <td className="px-4 py-3">
                        {sudahLapor ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            <span className="text-green-700 font-medium">Sudah Lapor</span>
                            <span className="text-xs text-gray-400">(Triwulan {triwulanList.join(', ')})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-red-500">Belum Lapor</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daftar Laporan */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-gray-900">Riwayat Laporan</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari sekolah..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border rounded-lg w-full sm:w-48"
                />
              </div>
              <select
                value={filterTriwulan}
                onChange={e => setFilterTriwulan(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg"
              >
                <option value="Semua">Semua Triwulan</option>
                {TRIMULAN.map(t => <option key={t} value={t}>Triwulan {t}</option>)}
              </select>
              <button
                onClick={() => exportToExcel(filtered.map(d => ({
                  namaSekolah: d.namaSekolah,
                  npsn: d.npsn,
                  triwulan: `Triwulan ${d.triwulan}`,
                  ppnBelum: d.pajakBelumSetor?.ppn || 0,
                  pph21Belum: d.pajakBelumSetor?.pph21 || 0,
                  pph23Belum: d.pajakBelumSetor?.pph23 || 0,
                  nilaiBelum: d.pajakBelumSetor?.nilaiKeseluruhan || 0,
                  ppnSudah: d.pajakSudahSetor?.ppn || 0,
                  pph21Sudah: d.pajakSudahSetor?.pph21 || 0,
                  pph23Sudah: d.pajakSudahSetor?.pph23 || 0,
                  nilaiSudah: d.pajakSudahSetor?.nilaiKeseluruhan || 0,
                  keterangan: KETERANGAN.find(k => k.value === d.keterangan)?.label || d.keterangan,
                })), [
                  { header: 'Nama Sekolah', key: 'namaSekolah' },
                  { header: 'NPSN', key: 'npsn' },
                  { header: 'Triwulan', key: 'triwulan' },
                  { header: 'PPN Belum Setor', key: 'ppnBelum' },
                  { header: 'PPH21 Belum Setor', key: 'pph21Belum' },
                  { header: 'PPH23 Belum Setor', key: 'pph23Belum' },
                  { header: 'Nilai Belum Setor', key: 'nilaiBelum' },
                  { header: 'PPN Sudah Setor', key: 'ppnSudah' },
                  { header: 'PPH21 Sudah Setor', key: 'pph21Sudah' },
                  { header: 'PPH23 Sudah Setor', key: 'pph23Sudah' },
                  { header: 'Nilai Sudah Setor', key: 'nilaiSudah' },
                  { header: 'Keterangan', key: 'keterangan' },
                ], `lapor-pajak-${filterTriwulan}-${Date.now()}`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Unduh Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Sekolah</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">NPSN</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Triwulan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pajak Belum Setor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pajak Sudah Setor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada laporan</td></tr>
                ) : (
                  filtered.map(l => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{l.namaSekolah}</td>
                      <td className="px-4 py-3 text-gray-600">{l.npsn}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          Triwulan {l.triwulan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">Rp{currency(l.pajakBelumSetor?.nilaiKeseluruhan || 0)}</td>
                      <td className="px-4 py-3 text-gray-600">Rp{currency(l.pajakSudahSetor?.nilaiKeseluruhan || 0)}</td>
                      <td className="px-4 py-3">
                        <KeteranganBadge value={l.keterangan} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 sm:p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">Lapor Pajak Per Triwulan</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5">
              {/* Data Sekolah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Triwulan</label>
                  <select
                    required
                    value={formTriwulan}
                    onChange={e => setFormTriwulan(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Pilih Triwulan</option>
                    {TRIMULAN.map(t => <option key={t} value={t}>Triwulan {t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NPSN</label>
                  <input
                    type="text"
                    required
                    value={formNpsn}
                    onChange={e => setFormNpsn(e.target.value)}
                    placeholder="Masukkan NPSN"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekolah</label>
                  <input
                    type="text"
                    readOnly
                    value={formNamaSekolah}
                    placeholder="Otomatis terisi"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Sekolah</label>
                  <input
                    type="text"
                    readOnly
                    value={formStatus}
                    placeholder="Otomatis terisi"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                  <input
                    type="text"
                    readOnly
                    value={formKecamatan}
                    placeholder="Otomatis terisi"
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              {/* Pajak Belum Setor */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Pajak Belum Setor Triwulan {formTriwulan || '...'}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PPN</label>
                    <input type="number" min="0" value={formBlmPpn || ''} onChange={e => setFormBlmPpn(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PPH 21</label>
                    <input type="number" min="0" value={formBlmPph21 || ''} onChange={e => setFormBlmPph21(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PPH 23</label>
                    <input type="number" min="0" value={formBlmPph23 || ''} onChange={e => setFormBlmPph23(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nilai Keseluruhan</label>
                    <div className="w-full px-3 py-2 border rounded-lg text-sm bg-blue-50 font-semibold text-blue-700">Rp{currency(nilaiBlm)}</div>
                  </div>
                </div>
              </div>

              {/* Pajak Sudah Setor */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Pajak Sudah Setor Triwulan {formTriwulan || '...'}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PPN</label>
                    <input type="number" min="0" value={formSdhPpn || ''} onChange={e => setFormSdhPpn(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PPH 21</label>
                    <input type="number" min="0" value={formSdhPph21 || ''} onChange={e => setFormSdhPph21(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PPH 23</label>
                    <input type="number" min="0" value={formSdhPph23 || ''} onChange={e => setFormSdhPph23(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nilai Keseluruhan</label>
                    <div className="w-full px-3 py-2 border rounded-lg text-sm bg-green-50 font-semibold text-green-700">Rp{currency(nilaiSdh)}</div>
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <div className="flex flex-wrap gap-2">
                  {KETERANGAN.map(k => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setFormKeterangan(k.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        formKeterangan === k.value
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 border rounded-xl hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 rounded-xl hover:bg-blue-800 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KeteranganBadge({ value }: { value: string }) {
  const item = KETERANGAN.find(k => k.value === value);
  if (!item) return <span className="text-gray-400">-</span>;
  const colors: Record<string, string> = {
    sudah_bayar: 'bg-green-100 text-green-700',
    kurang_bayar: 'bg-red-100 text-red-700',
    lebih_bayar: 'bg-yellow-100 text-yellow-700',
  };
  const icons: Record<string, React.ReactNode> = {
    sudah_bayar: <CheckCircle2 className="w-3.5 h-3.5" />,
    kurang_bayar: <AlertTriangle className="w-3.5 h-3.5" />,
    lebih_bayar: <AlertTriangle className="w-3.5 h-3.5" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${colors[value] || ''}`}>
      {icons[value]}
      {item.label}
    </span>
  );
}
