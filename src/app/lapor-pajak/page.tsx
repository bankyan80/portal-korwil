'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, Search, Receipt, CheckCircle2, XCircle, AlertTriangle, Download, Clock, Send, ExternalLink, Pencil, Trash2 } from 'lucide-react';
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

const fmt = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 });

function currency(n: number) {
  return fmt.format(n || 0);
}

function formatRupiah(value: any) {
  return `Rp${fmt.format(parseNominalPajak(value))}`;
}

function formatRupiahTanpaRp(value: number) {
  return fmt.format(value || 0);
}

function parseNominalPajak(value: any): number {
  if (value === null || value === undefined) return 0;
  let raw = String(value).trim();
  if (!raw) return 0;
  raw = raw.replace(/Rp/gi, '').replace(/\s/g, '').replace(/[^\d.,-]/g, '');
  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  if (hasComma && hasDot) {
    const lastComma = raw.lastIndexOf(',');
    const lastDot = raw.lastIndexOf('.');
    if (lastDot > lastComma) {
      raw = raw.replace(/,/g, '');
    } else {
      raw = raw.replace(/\./g, '');
      raw = raw.replace(',', '.');
    }
  } else if (hasComma && !hasDot) {
    raw = raw.replace(',', '.');
  } else if (hasDot && !hasComma) {
    const parts = raw.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      raw = raw.replace(/\./g, '');
    }
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : 0;
}

function hitungNilaiPajak(ppn: any, pph21: any, pph23: any) {
  return parseNominalPajak(ppn) + parseNominalPajak(pph21) + parseNominalPajak(pph23);
}

function getKeteranganPajak(nilaiBelumSetor: number, nilaiSudahSetor: number) {
  const belum = Number(nilaiBelumSetor || 0);
  const sudah = Number(nilaiSudahSetor || 0);
  if (belum === 0 && sudah === 0) return 'Pajak Januari-Maret belum dibayar';
  if (belum > 0 && sudah === 0) return 'Pajak Januari-Maret belum dibayar';
  if (belum === sudah) return 'Pajak Januari-Maret sudah dibayar';
  if (belum > sudah) return 'Pajak Januari-Maret Kurang bayar: ' + formatRupiahTanpaRp(belum - sudah);
  return 'Pajak Januari-Maret Lebih bayar: ' + formatRupiahTanpaRp(sudah - belum);
}

function getStatusTriwulan(sekolah: School, triwulan: string, laporan: LaporPajak[], tahun: string) {
  const l = laporan.find(item =>
    String(item.npsn) === String(sekolah.npsn) &&
    String(item.triwulan) === String(triwulan)
  );
  if (!l) return { status: 'belum', label: 'Belum', className: 'text-red-600', icon: 'x' };
  if (l.keterangan?.includes('sedang proses') || l.keterangan?.includes('menunggu'))
    return { status: 'proses', label: 'Proses', className: 'text-yellow-600', icon: 'clock' };
  return { status: 'sudah', label: 'Sudah', className: 'text-green-600', icon: 'check' };
}

function hitungProgresSekolah(sekolah: School, laporan: LaporPajak[], tahun: string) {
  const jumlahSudah = TRIMULAN.filter(tw => getStatusTriwulan(sekolah, tw, laporan, tahun).status === 'sudah').length;
  return { jumlahSudah, totalTriwulan: 4, persen: Math.round((jumlahSudah / 4) * 100) };
}

function getStatusAkhir(progres: { persen: number }) {
  if (progres.persen === 100) return 'Lengkap';
  if (progres.persen === 0) return 'Belum Lapor';
  return 'Belum Lengkap';
}

export default function LaporPajakPage() {
  const [data, setData] = useState<LaporPajak[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterTriwulan, setFilterTriwulan] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailSekolah, setDetailSekolah] = useState<School | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formTriwulan, setFormTriwulan] = useState('');
  const [formNpsn, setFormNpsn] = useState('');
  const [formNamaSekolah, setFormNamaSekolah] = useState('');
  const [formStatus, setFormStatus] = useState('');
  const [formKecamatan, setFormKecamatan] = useState('');
  const [formBlmPpn, setFormBlmPpn] = useState('');
  const [formBlmPph21, setFormBlmPph21] = useState('');
  const [formBlmPph23, setFormBlmPph23] = useState('');
  const [formSdhPpn, setFormSdhPpn] = useState('');
  const [formSdhPph21, setFormSdhPph21] = useState('');
  const [formSdhPph23, setFormSdhPph23] = useState('');

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

  const nilaiBlm = useMemo(() => hitungNilaiPajak(formBlmPpn, formBlmPph21, formBlmPph23), [formBlmPpn, formBlmPph21, formBlmPph23]);
  const nilaiSdh = useMemo(() => hitungNilaiPajak(formSdhPpn, formSdhPph21, formSdhPph23), [formSdhPpn, formSdhPph21, formSdhPph23]);
  const autoKeterangan = useMemo(() => getKeteranganPajak(nilaiBlm, nilaiSdh), [nilaiBlm, nilaiSdh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formTriwulan || !formNpsn) return;
    setSubmitting(true);
    try {
      const body = {
        triwulan: formTriwulan,
        npsn: formNpsn,
        namaSekolah: formNamaSekolah,
        statusSekolah: formStatus,
        kecamatan: formKecamatan,
        pajakBelumSetor: { ppn: parseNominalPajak(formBlmPpn), pph21: parseNominalPajak(formBlmPph21), pph23: parseNominalPajak(formBlmPph23), nilaiKeseluruhan: parseNominalPajak(nilaiBlm) },
        pajakSudahSetor: { ppn: parseNominalPajak(formSdhPpn), pph21: parseNominalPajak(formSdhPph21), pph23: parseNominalPajak(formSdhPph23), nilaiKeseluruhan: parseNominalPajak(nilaiSdh) },
        keterangan: autoKeterangan,
        updatedAt: Date.now(),
      };
      if (editId) {
        const res = await fetch(`/api/firestore/lapor_pajak?id=${editId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: body, merge: true }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setData(prev => prev.map(d => d.id === editId ? { id: editId, ...body, createdAt: d.createdAt } : d));
      } else {
        const bodyWithCreated = { ...body, createdAt: Date.now() };
        const res = await fetch('/api/firestore/lapor_pajak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: bodyWithCreated }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setData(prev => [{ id: json.id, ...bodyWithCreated }, ...prev]);
      }
      setShowModal(false);
      resetForm();
    } catch (e: any) {
      alert('Gagal: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(l: LaporPajak) {
    setEditId(l.id);
    setFormTriwulan(l.triwulan);
    setFormNpsn(l.npsn);
    setFormNamaSekolah(l.namaSekolah);
    setFormStatus(l.statusSekolah);
    setFormKecamatan(l.kecamatan);
    setFormBlmPpn(l.pajakBelumSetor?.ppn ? fmt.format(l.pajakBelumSetor.ppn) : '');
    setFormBlmPph21(l.pajakBelumSetor?.pph21 ? fmt.format(l.pajakBelumSetor.pph21) : '');
    setFormBlmPph23(l.pajakBelumSetor?.pph23 ? fmt.format(l.pajakBelumSetor.pph23) : '');
    setFormSdhPpn(l.pajakSudahSetor?.ppn ? fmt.format(l.pajakSudahSetor.ppn) : '');
    setFormSdhPph21(l.pajakSudahSetor?.pph21 ? fmt.format(l.pajakSudahSetor.pph21) : '');
    setFormSdhPph23(l.pajakSudahSetor?.pph23 ? fmt.format(l.pajakSudahSetor.pph23) : '');
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus laporan pajak ini?')) return;
    try {
      const res = await fetch(`/api/firestore/lapor_pajak?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(prev => prev.filter(d => d.id !== id));
    } catch (e: any) {
      alert('Gagal: ' + e.message);
    }
  }

  function resetForm() {
    setEditId(null);
    setFormTriwulan('');
    setFormNpsn('');
    setFormNamaSekolah('');
    setFormStatus('');
    setFormKecamatan('');
    setFormBlmPpn('');
    setFormBlmPph21('');
    setFormBlmPph23('');
    setFormSdhPpn('');
    setFormSdhPph21('');
    setFormSdhPph23('');
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

        {/* Summary Cards */}
        {(() => {
          const totalSekolah = schoolsSD.length;
          const progresList = schoolsSD.map(s => ({ sekolah: s, progres: hitungProgresSekolah(s, data, filterTahun) }));
          const lengkap = progresList.filter(p => p.progres.persen === 100).length;
          const belumLapor = progresList.filter(p => p.progres.persen === 0).length;
          const belumLengkap = totalSekolah - lengkap - belumLapor;
          const kepatuhan = totalSekolah > 0 ? Math.round((lengkap / totalSekolah) * 100) : 0;
          return (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-gray-900">{totalSekolah}</p>
                <p className="text-xs text-gray-500">Total Sekolah</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-green-700">{lengkap}</p>
                <p className="text-xs text-gray-500">Lengkap 4 TW</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-amber-700">{belumLengkap}</p>
                <p className="text-xs text-gray-500">Belum Lengkap</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-red-700">{belumLapor}</p>
                <p className="text-xs text-gray-500">Belum Lapor</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-blue-700">{kepatuhan}%</p>
                <p className="text-xs text-gray-500">Kepatuhan</p>
              </div>
            </div>
          );
        })()}

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

        {/* Tabel Progres Matrix */}
        <div className="bg-white rounded-xl border mb-6">
          <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-gray-900">Progres Laporan Per Triwulan</h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Cari sekolah..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-3 py-2 text-sm border rounded-lg w-40" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border rounded-lg">
                <option value="Semua">Semua Status</option>
                <option value="Lengkap">Lengkap</option>
                <option value="Belum Lengkap">Belum Lengkap</option>
                <option value="Belum Lapor">Belum Lapor</option>
              </select>
              <select value={filterTriwulan} onChange={e => setFilterTriwulan(e.target.value)} className="px-3 py-2 text-sm border rounded-lg">
                <option value="Semua">Semua Triwulan</option>
                {TRIMULAN.map(t => <option key={t} value={t}>Triwulan {t}</option>)}
              </select>
              <button onClick={() => {
                const rows = schoolsSD.map(s => {
                  const progres = hitungProgresSekolah(s, data, filterTahun);
                  const row: any = { namaSekolah: s.namaSekolah, npsn: s.npsn };
                  TRIMULAN.forEach(tw => { row[`tw${tw}`] = getStatusTriwulan(s, tw, data, filterTahun).status === 'sudah' ? 'Sudah' : 'Belum'; });
                  row.progres = `${progres.persen}%`;
                  row.statusAkhir = getStatusAkhir(progres);
                  return row;
                });
                const cols = [
                  { header: 'Nama Sekolah', key: 'namaSekolah' },
                  { header: 'NPSN', key: 'npsn' },
                  ...TRIMULAN.map(tw => ({ header: `TW ${tw}`, key: `tw${tw}` })),
                  { header: 'Progres', key: 'progres' },
                  { header: 'Status Akhir', key: 'statusAkhir' },
                ];
                exportToExcel(rows, cols, `progres-pajak-${Date.now()}`);
              }} className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-center px-2 py-3 font-medium text-gray-600 w-10">No</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Sekolah</th>
                  <th className="text-center px-2 py-3 font-medium text-gray-600">NPSN</th>
                  {TRIMULAN.map(tw => <th key={tw} className="text-center px-2 py-3 font-medium text-gray-600">TW {tw}</th>)}
                  <th className="text-center px-3 py-3 font-medium text-gray-600">Progres</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {schoolsSD
                  .filter(s => {
                    if (search) {
                      const q = search.toLowerCase();
                      return s.namaSekolah.toLowerCase().includes(q) || s.npsn.includes(q);
                    }
                    return true;
                  })
                  .filter(s => {
                    const progres = hitungProgresSekolah(s, data, filterTahun);
                    const status = getStatusAkhir(progres);
                    if (filterStatus !== 'Semua' && status !== filterStatus) return false;
                    if (filterTriwulan !== 'Semua') {
                      const st = getStatusTriwulan(s, filterTriwulan, data, filterTahun).status;
                      if (st !== 'sudah') return false;
                    }
                    return true;
                  })
                  .map((s, i) => {
                    const progres = hitungProgresSekolah(s, data, filterTahun);
                    const statusAkhir = getStatusAkhir(progres);
                    const statusColor = statusAkhir === 'Lengkap' ? 'text-green-700 bg-green-50' : statusAkhir === 'Belum Lapor' ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50';
                    return (
                      <tr key={s.npsn} className="border-b hover:bg-gray-50">
                        <td className="text-center px-2 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{s.namaSekolah}</div>
                        </td>
                        <td className="text-center px-2 py-3 text-xs text-gray-500">{s.npsn}</td>
                        {TRIMULAN.map(tw => {
                          const st = getStatusTriwulan(s, tw, data, filterTahun);
                          return (
                            <td key={tw} className="text-center px-2 py-3">
                              {st.status === 'sudah' ? <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                                : st.status === 'proses' ? <Clock className="w-5 h-5 text-yellow-600 mx-auto" />
                                : <XCircle className="w-5 h-5 text-red-300 mx-auto" />}
                            </td>
                          );
                        })}
                        <td className="text-center px-3 py-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${progres.persen}%`, backgroundColor: progres.persen === 100 ? '#16a34a' : progres.persen > 0 ? '#d97706' : '#ef4444' }} />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{progres.persen}%</span>
                          </div>
                          <div className="text-[10px] text-gray-400">{progres.jumlahSudah}/{progres.totalTriwulan} TW</div>
                        </td>
                        <td className="text-center px-3 py-3">
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>{statusAkhir}</span>
                        </td>
                        <td className="text-center px-3 py-3">
                          <button onClick={() => setDetailSekolah(s)} className="text-xs text-blue-600 hover:underline">Detail</button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          </div>

        {/* Detail Modal */}
        {detailSekolah && (() => {
          const s = detailSekolah;
          const progres = hitungProgresSekolah(s, data, filterTahun);
          const statusAkhir = getStatusAkhir(progres);
          const pesan = `Yth. Operator ${s.namaSekolah}, mohon segera melengkapi laporan pajak triwulan yang belum dikirim pada aplikasi Portal Korwil. Terima kasih.`;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={() => setDetailSekolah(null)}>
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 sm:p-5 border-b">
                  <h2 className="text-lg font-bold text-gray-900">Detail Progres</h2>
                  <button onClick={() => setDetailSekolah(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><XCircle className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                  <div>
                    <p className="text-base font-bold text-gray-900">{s.namaSekolah}</p>
                    <p className="text-xs text-gray-500">NPSN: {s.npsn} • {s.kecamatan}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TRIMULAN.map(tw => {
                      const st = getStatusTriwulan(s, tw, data, filterTahun);
                      const laporan = data.find(l => String(l.npsn) === String(s.npsn) && String(l.triwulan) === String(tw));
                      return (
                        <div key={tw} className={`text-center p-3 rounded-xl border ${st.status === 'sudah' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-xs font-medium text-gray-500 mb-1">TW {tw}</p>
                          {st.status === 'sudah' ? <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto" /> : <XCircle className="w-6 h-6 text-red-400 mx-auto" />}
                          <p className={`text-xs font-medium mt-1 ${st.status === 'sudah' ? 'text-green-700' : 'text-red-600'}`}>{st.label}</p>
                          {laporan && <p className="text-[10px] text-gray-400 mt-1">Rp{currency(laporan.pajakBelumSetor?.nilaiKeseluruhan || 0)}</p>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progres</span>
                      <span className="text-sm font-bold">{progres.persen}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${progres.persen}%`, backgroundColor: progres.persen === 100 ? '#16a34a' : '#d97706' }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{progres.jumlahSudah} dari {progres.totalTriwulan} triwulan</p>
                  </div>
                  <div className={`text-center p-3 rounded-xl border ${statusAkhir === 'Lengkap' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <p className="text-sm font-semibold">{statusAkhir}</p>
                  </div>
                  {statusAkhir !== 'Lengkap' && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Pengingat:</p>
                      <div className="bg-gray-50 rounded-lg p-3 border text-xs text-gray-700 whitespace-pre-wrap">{pesan}</div>
                      <div className="flex gap-2">
                        <button onClick={() => { navigator.clipboard.writeText(pesan); alert('Pesan disalin!'); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">
                          <Send className="w-4 h-4" /> Salin
                        </button>
                        <a href={`https://wa.me/?text=${encodeURIComponent(pesan)}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                          <ExternalLink className="w-4 h-4" /> WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 border-t flex justify-end">
                  <button onClick={() => setDetailSekolah(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Tutup</button>
                </div>
              </div>
            </div>
          );
        })()}

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
                  keterangan: d.keterangan,
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
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
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
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(l)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Ubah"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(l.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
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
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Ubah Laporan Pajak' : 'Lapor Pajak Per Triwulan'}</h2>
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
                    disabled={!!editId}
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
                    readOnly={!!editId}
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
                      <input type="text" inputMode="decimal" value={formBlmPpn} onChange={e => setFormBlmPpn(e.target.value)} onBlur={e => { const v = parseNominalPajak(e.target.value); setFormBlmPpn(v ? fmt.format(v) : ''); }} placeholder="0,00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">PPH 21</label>
                      <input type="text" inputMode="decimal" value={formBlmPph21} onChange={e => setFormBlmPph21(e.target.value)} onBlur={e => { const v = parseNominalPajak(e.target.value); setFormBlmPph21(v ? fmt.format(v) : ''); }} placeholder="0,00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">PPH 23</label>
                      <input type="text" inputMode="decimal" value={formBlmPph23} onChange={e => setFormBlmPph23(e.target.value)} onBlur={e => { const v = parseNominalPajak(e.target.value); setFormBlmPph23(v ? fmt.format(v) : ''); }} placeholder="0,00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nilai Keseluruhan</label>
                      <div className="w-full px-3 py-2 border rounded-lg text-sm bg-blue-50 font-semibold text-blue-700">{formatRupiah(nilaiBlm)}</div>
                    </div>
                  </div>
                </div>

                {/* Pajak Sudah Setor */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Pajak Sudah Setor Triwulan {formTriwulan || '...'}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">PPN</label>
                      <input type="text" inputMode="decimal" value={formSdhPpn} onChange={e => setFormSdhPpn(e.target.value)} onBlur={e => { const v = parseNominalPajak(e.target.value); setFormSdhPpn(v ? fmt.format(v) : ''); }} placeholder="0,00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">PPH 21</label>
                      <input type="text" inputMode="decimal" value={formSdhPph21} onChange={e => setFormSdhPph21(e.target.value)} onBlur={e => { const v = parseNominalPajak(e.target.value); setFormSdhPph21(v ? fmt.format(v) : ''); }} placeholder="0,00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">PPH 23</label>
                      <input type="text" inputMode="decimal" value={formSdhPph23} onChange={e => setFormSdhPph23(e.target.value)} onBlur={e => { const v = parseNominalPajak(e.target.value); setFormSdhPph23(v ? fmt.format(v) : ''); }} placeholder="0,00" className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nilai Keseluruhan</label>
                      <div className="w-full px-3 py-2 border rounded-lg text-sm bg-green-50 font-semibold text-green-700">{formatRupiah(nilaiSdh)}</div>
                    </div>
                  </div>
                </div>

              {/* Keterangan */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <p className="text-base font-semibold text-blue-700">{autoKeterangan}</p>
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
                  {submitting ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Laporan'}
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
  const isSudah = value.includes('sudah dibayar');
  const isKurang = value.includes('Kurang bayar');
  const isLebih = value.includes('Lebih bayar');
  const colors = isSudah ? 'bg-green-100 text-green-700' : isKurang ? 'bg-red-100 text-red-700' : isLebih ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600';
  const icon = isSudah ? <CheckCircle2 className="w-3.5 h-3.5" /> : isKurang || isLebih ? <AlertTriangle className="w-3.5 h-3.5" /> : null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${colors}`}>
      {icon}
      {value}
    </span>
  );
}
