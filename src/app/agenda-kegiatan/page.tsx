'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/portal/Footer';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { useAppStore } from '@/store/app-store';
import { CalendarDays, Search, Loader2, Clock, MapPin, ArrowLeft, Plus, Pencil, Trash2, X } from 'lucide-react';
import type { CalendarEvent } from '@/types';

const defaultData: CalendarEvent[] = [
  { id: 'agenda-1', title: 'Hari Pertama Masuk Sekolah', description: 'Hari pertama masuk sekolah TP 2025/2026', tanggal: '14 Juli 2025', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() },
  { id: 'agenda-2', title: 'MPLS', description: 'Masa Pengenalan Lingkungan Sekolah', tanggal: '14-18 Juli 2025', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 86400000 },
  { id: 'agenda-3', title: 'HUT Kemerdekaan RI', description: 'Libur Nasional', tanggal: '17 Agustus 2025', lokasi: '-', type: 'holiday', organizerName: 'Admin', createdAt: Date.now() - 172800000 },
  { id: 'agenda-4', title: 'Asesmen Nasional SMP', description: 'Pelaksanaan AN SMP/Paket B', tanggal: '25-28 Agustus 2025', lokasi: 'SMP', type: 'exam', organizerName: 'Admin', createdAt: Date.now() - 259200000 },
  { id: 'agenda-5', title: 'Maulid Nabi Muhammad SAW', description: 'Libur Nasional', tanggal: '5 September 2025', lokasi: '-', type: 'holiday', organizerName: 'Admin', createdAt: Date.now() - 345600000 },
  { id: 'agenda-6', title: 'Tes Kompetensi Akademik', description: 'Prakiraan Tes Kompetensi Akademik Paket C', tanggal: '1-19 November 2025', lokasi: 'Sekolah', type: 'exam', organizerName: 'Admin', createdAt: Date.now() - 432000000 },
  { id: 'agenda-7', title: 'Hari Pertama Masuk Sekolah Semester 2', description: 'Prakiraan Hari pertama masuk sekolah semester 2', tanggal: '12 Januari 2026', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 518400000 },
  { id: 'agenda-8', title: 'Pembagian Rapor', description: 'Prakiraan Pembagian rapor semester 2 dan kenaikan kelas', tanggal: '24-26 Juni 2026', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 604800000 },
  { id: 'agenda-9', title: 'Libur Akhir Tahun Pelajaran', description: 'Prakiraan Libur akhir tahun pelajaran', tanggal: '29 Juni - 11 Juli 2026', lokasi: '-', type: 'holiday', organizerName: 'Admin', createdAt: Date.now() - 691200000 },
  { id: 'agenda-10', title: 'Hari Pertama Masuk Sekolah TP 2026/2027', description: 'Prakiraan Hari Pertama Masuk Sekolah Tahun Pelajaran 2026/2027', tanggal: '13 Juli 2026', lokasi: 'Seluruh Sekolah', type: 'academic', organizerName: 'Admin', createdAt: Date.now() - 777600000 },
];

const typeOptions = [
  { value: 'academic', label: 'Akademik' },
  { value: 'holiday', label: 'Libur' },
  { value: 'exam', label: 'Ujian' },
  { value: 'meeting', label: 'Rapat' },
  { value: 'other', label: 'Lainnya' },
];

const emptyForm = { title: '', description: '', tanggal: '', waktu: '', lokasi: '', type: 'academic' as const };

export default function AgendaKegiatanPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const { items: data, loading, addItem, updateItem, deleteItem } = useFirestoreCollection<CalendarEvent>('calendar_events', defaultData);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const canManage = user && ['super_admin', 'operator_sekolah', 'ketua_organisasi'].includes(user.role);

  const filtered = data.filter((d) =>
    !search || d.title?.toLowerCase().includes(search.toLowerCase()) || d.tanggal?.includes(search)
  );

  async function handleSave() {
    if (!form.title || !form.tanggal) return;
    setSaving(true);
    try {
      if (editId) {
        await updateItem(editId, { ...form, updatedAt: Date.now() } as any);
      } else {
        await addItem({ ...form, organizerName: user?.displayName || 'Admin', createdAt: Date.now() } as any);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } catch {} finally { setSaving(false); }
  }

  function openEdit(item: CalendarEvent) {
    setForm({
      title: item.title || '',
      description: item.description || '',
      tanggal: item.tanggal || '',
      waktu: item.waktu || '',
      lokasi: item.lokasi || '',
      type: item.type || 'academic',
    });
    setEditId(item.id || null);
    setShowForm(true);
  }

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <h1 className="text-sm font-bold text-white uppercase tracking-wide">KALENDER PENDIDIKAN</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0d3b66] mb-2">TAHUN PELAJARAN 2025/2026</h2>
              <h3 className="text-lg font-semibold text-gray-700">DINAS PENDIDIKAN KABUPATEN CIREBON</h3>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Cari agenda..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full" />
              </div>
              <span className="text-xs text-gray-500">{filtered.length} agenda</span>
              {canManage && (
                <button onClick={openAdd}
                  className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800">
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Agenda tidak ditemukan</div>
            ) : (
              <div className="space-y-3">
                {filtered.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow relative group">
                    <div className="flex flex-col sm:flex-row">
                      <div className="bg-blue-800 text-white px-4 py-3 sm:w-44 shrink-0 flex sm:flex-col items-center sm:items-start justify-center gap-1">
                        <CalendarDays className="w-5 h-5 sm:mb-1" />
                        <p className="text-sm font-semibold text-center sm:text-left leading-tight">{item.tanggal}</p>
                      </div>
                      <div className="flex-1 p-4">
                        <h3 className="font-semibold text-[#0d3b66]">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {item.waktu && (
                            <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.waktu}</p>
                          )}
                          {item.lokasi && item.lokasi !== '-' && (
                            <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.lokasi}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 bg-white rounded-lg border shadow-sm hover:bg-gray-50 text-blue-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={async () => { if (confirm('Hapus agenda ini?')) await deleteItem(item.id!); }}
                          className="p-1.5 bg-white rounded-lg border shadow-sm hover:bg-gray-50 text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> Kalender pendidikan ini dapat berubah sesuai dengan kebijakan Dinas Pendidikan Kabupaten Cirebon dan Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi. Perubahan akan diinformasikan melalui portal ini.
              </p>
            </div>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { if (!saving) { setShowForm(false); setEditId(null); setForm(emptyForm); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editId ? 'Edit Agenda' : 'Tambah Agenda'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Judul *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2" placeholder="Nama agenda" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2" rows={2} placeholder="Deskripsi agenda" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Tanggal *</label>
                  <input value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                    className="w-full text-sm border rounded-lg px-3 py-2" placeholder="14 Juli 2025" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Waktu</label>
                  <input value={form.waktu} onChange={e => setForm(f => ({ ...f, waktu: e.target.value }))}
                    className="w-full text-sm border rounded-lg px-3 py-2" placeholder="08:00 - 12:00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Lokasi</label>
                  <input value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
                    className="w-full text-sm border rounded-lg px-3 py-2" placeholder="Seluruh Sekolah" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">Tipe</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                    className="w-full text-sm border rounded-lg px-3 py-2">
                    {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.tanggal}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
