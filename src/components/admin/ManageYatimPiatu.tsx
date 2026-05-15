'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { AdminEmptyState } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Heart, Search, Plus, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { YatimPiatuData, YatimCategory } from '@/types';

const kategoriLabel: Record<YatimCategory, string> = {
  yatim_piatu: 'Yatim Piatu',
  yatim: 'Yatim',
  piatu: 'Piatu',
};

const kategoriColors: Record<YatimCategory, string> = {
  yatim_piatu: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  yatim: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  piatu: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

export function ManageYatimPiatu() {
  const { user } = useAppStore();
  const [data, setData] = useState<YatimPiatuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nikInput, setNikInput] = useState('');
  const [kategori, setKategori] = useState<YatimCategory>('yatim_piatu');
  const [addStatus, setAddStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const userSchool = user?.schoolName || '';

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

  const filteredData = useMemo(() => {
    if (!userSchool) return data;
    return data.filter(d => d.sekolah.toLowerCase().includes(userSchool.toLowerCase()));
  }, [data, userSchool]);

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
      if (!json.found) {
        setAddStatus({ ok: false, msg: 'NIK tidak ditemukan dalam database siswa' });
        return;
      }
      const s = json.siswa;
      if (!db) {
        const newItem: YatimPiatuData = { id: Date.now().toString(), nik: s.nik, nama: s.nama, sekolah: s.sekolah, desa: s.desa, kategori, createdAt: Date.now() };
        setData(prev => [newItem, ...prev]);
      } else {
        await addDoc(collection(db, 'yatim_piatu'), { nik: s.nik, nama: s.nama, sekolah: s.sekolah, desa: s.desa, kategori, createdAt: Date.now() });
      }
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
    try { await deleteDoc(doc(db, 'yatim_piatu', id)); } catch (e) { console.error('Error deleting yatim piatu:', e); }
  }

  const counts = useMemo(() => ({
    yatim_piatu: filteredData.filter(d => d.kategori === 'yatim_piatu').length,
    yatim: filteredData.filter(d => d.kategori === 'yatim').length,
    piatu: filteredData.filter(d => d.kategori === 'piatu').length,
  }), [filteredData]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-800 dark:text-red-300">{counts.yatim_piatu}</p>
          <p className="text-xs text-red-700 dark:text-red-400">Yatim Piatu</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{counts.yatim}</p>
          <p className="text-xs text-blue-700 dark:text-blue-400">Yatim</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{counts.piatu}</p>
          <p className="text-xs text-purple-700 dark:text-purple-400">Piatu</p>
        </div>
      </div>

      {addStatus && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${addStatus.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
          {addStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span>{addStatus.msg}</span>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <h3 className="font-semibold text-foreground">Tambah Data</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text" maxLength={16} placeholder="Masukkan 16 digit NIK"
                value={nikInput}
                onChange={e => { setNikInput(e.target.value.replace(/\D/g, '').slice(0, 16)); setAddStatus(null); }}
                className="pl-9 font-mono tracking-wider"
              />
            </div>
            <select
              value={kategori}
              onChange={e => setKategori(e.target.value as YatimCategory)}
              className="text-sm border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="yatim_piatu">Yatim Piatu</option>
              <option value="yatim">Yatim</option>
              <option value="piatu">Piatu</option>
            </select>
            <Button onClick={handleAdd} disabled={adding} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tambah
            </Button>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <AdminEmptyState icon={Heart} title="Belum ada data" description="Data yatim piatu belum ditambahkan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIK</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sekolah</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Kategori</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredData.map((d, i) => (
                  <tr key={d.id || d.nik} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.nik}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{d.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{d.sekolah}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${kategoriColors[d.kategori]}`}>
                        {kategoriLabel[d.kategori]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(d.id!)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
