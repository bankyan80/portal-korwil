'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Heart, Search, Plus, Trash2, Loader2, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import type { YatimPiatuData, YatimCategory } from '@/types';

const kategoriLabel: Record<YatimCategory, string> = {
  yatim_piatu: 'Yatim Piatu',
  yatim: 'Yatim',
  piatu: 'Piatu',
};

const kategoriColors: Record<YatimCategory, string> = {
  yatim_piatu: 'bg-red-100 text-red-700',
  yatim: 'bg-blue-100 text-blue-700',
  piatu: 'bg-purple-100 text-purple-700',
};

export default function YatimPiatuPage() {
  const [data, setData] = useState<YatimPiatuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nikInput, setNikInput] = useState('');
  const [kategori, setKategori] = useState<YatimCategory>('yatim_piatu');
  const [addStatus, setAddStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!db) {
      setData([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'yatim_piatu'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: YatimPiatuData[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as YatimPiatuData));
      setData(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  async function handleAdd() {
    const clean = nikInput.replace(/\D/g, '');
    if (clean.length !== 16) {
      setAddStatus({ ok: false, msg: 'NIK harus 16 digit' });
      return;
    }
    if (data.some(d => d.nik === clean)) {
      setAddStatus({ ok: false, msg: 'NIK sudah terdaftar' });
      return;
    }
    setAdding(true);
    setAddStatus(null);

    try {
      const res = await fetch(`/api/siswa/lookup?nik=${clean}`);
      const json = await res.json();

      if (!db) {
        if (!json.found) {
          setAddStatus({ ok: false, msg: 'NIK tidak ditemukan dalam database siswa' });
          return;
        }
        const s = json.siswa;
        const newItem: YatimPiatuData = { id: Date.now().toString(), nik: s.nik, nama: s.nama, sekolah: s.sekolah, desa: s.desa, kategori, createdAt: Date.now() };
        setData(prev => [newItem, ...prev]);
        setAddStatus({ ok: true, msg: `${s.nama} ditambahkan sebagai ${kategoriLabel[kategori]}` });
        setNikInput('');
        return;
      }

      if (!json.found) {
        setAddStatus({ ok: false, msg: 'NIK tidak ditemukan dalam database siswa' });
        return;
      }
      const s = json.siswa;
      await addDoc(collection(db, 'yatim_piatu'), {
        nik: s.nik,
        nama: s.nama,
        sekolah: s.sekolah,
        desa: s.desa,
        kategori,
        createdAt: Date.now(),
      });
      setAddStatus({ ok: true, msg: `${s.nama} ditambahkan sebagai ${kategoriLabel[kategori]}` });
      setNikInput('');
    } catch (e) {
      console.error('Error adding yatim piatu:', e);
      setAddStatus({ ok: false, msg: 'Gagal menghubungi server' });
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!db) {
      setData(prev => prev.filter(d => d.id !== id));
      return;
    }
    try {
      await deleteDoc(doc(db, 'yatim_piatu', id));
    } catch (e) {
      console.error('Gagal hapus data:', e);
    }
  }

  const counts = useMemo(() => ({
    yatim_piatu: data.filter(d => d.kategori === 'yatim_piatu').length,
    yatim: data.filter(d => d.kategori === 'yatim').length,
    piatu: data.filter(d => d.kategori === 'piatu').length,
  }), [data]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </a>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Yatim Piatu</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Data Yatim Piatu</h2>
          <p className="text-sm text-gray-500 mt-1">Kecamatan Lemahabang, Kabupaten Cirebon</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-800">{counts.yatim_piatu}</p>
                <p className="text-xs text-red-700">Yatim Piatu</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-800">{counts.yatim}</p>
                <p className="text-xs text-blue-700">Yatim (Ayah Meninggal)</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-purple-800">{counts.piatu}</p>
                <p className="text-xs text-purple-700">Piatu (Ibu Meninggal)</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b space-y-3">
                <h3 className="font-semibold text-[#0d3b66]">Tambah Data</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="Masukkan 16 digit NIK"
                      value={nikInput}
                      onChange={e => { setNikInput(e.target.value.replace(/\D/g, '').slice(0, 16)); setAddStatus(null); }}
                      className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full font-mono tracking-wider"
                    />
                  </div>
                  <select
                    value={kategori}
                    onChange={e => setKategori(e.target.value as YatimCategory)}
                    className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="yatim_piatu">Yatim Piatu</option>
                    <option value="yatim">Yatim (Ayah Meninggal)</option>
                    <option value="piatu">Piatu (Ibu Meninggal)</option>
                  </select>
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Tambah
                  </button>
                </div>
                {addStatus && (
                  <div className={`p-3 rounded-lg text-sm ${addStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center gap-2">
                      {addStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                      <span>{addStatus.msg}</span>
                    </div>
                    {!addStatus.ok && addStatus.msg.includes('NIK tidak ditemukan') && (
                      <a
                        href={`https://wa.me/6281321592990?text=${encodeURIComponent(`Assalamualaikum, saya ingin melaporkan data yatim piatu dengan NIK: ${nikInput}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Hubungi Admin via WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 font-semibold text-gray-600">No</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">NIK</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Nama</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Sekolah</th>
                      <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Desa</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Kategori</th>
                      <th className="px-5 py-3 font-semibold text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                          Belum ada data
                        </td>
                      </tr>
                    ) : (
                      data.map((d, i) => (
                        <tr key={d.id || d.nik} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">{d.nik}</td>
                          <td className="px-5 py-3 font-medium text-[#0d3b66] whitespace-nowrap">{d.nama}</td>
                          <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate">{d.sekolah}</td>
                          <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{d.desa}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${kategoriColors[d.kategori]}`}>
                              {kategoriLabel[d.kategori]}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => handleDelete(d.id!)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="font-semibold text-[#0d3b66] mb-2">Keterangan</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li><strong>Yatim Piatu</strong>: Kedua orang tua (ayah dan ibu) meninggal dunia.</li>
                <li><strong>Yatim</strong>: Ayah yang meninggal dunia.</li>
                <li><strong>Piatu</strong>: Ibu yang meninggal dunia.</li>
                <li>Data diambil dari database siswa. Jika tidak ditemukan, sekolah dapat menambahkan dengan memasukkan NIK.</li>
              </ul>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
