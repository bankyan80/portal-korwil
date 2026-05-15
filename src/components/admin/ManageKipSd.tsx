'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { AdminEmptyState } from '@/components/shared/AdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { WalletMinimal, Search, Plus, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { KipSdData } from '@/types';

interface SiswaItem {
  nik: string;
  nama: string;
  jk: string;
  nisn: string;
  tanggal_lahir: string;
  sekolah: string;
  jenjang: string;
  desa: string;
  layak_pip: string;
}

export function ManageKipSd() {
  const { user } = useAppStore();
  const [data, setData] = useState<KipSdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SiswaItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addStatus, setAddStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  const userSchool = user?.schoolName || '';

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'kip_sd'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: KipSdData[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as KipSdData));
      setData(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearched(false);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/siswa/list?jenjang=SD&layak_pip=Ya`);
      const json = await res.json();
      let filtered = json.siswa.filter((s: SiswaItem) =>
        s.nama.toLowerCase().includes(q.toLowerCase()) || s.nik.includes(q)
      );
      if (userSchool) {
        filtered = filtered.filter((s: SiswaItem) =>
          s.sekolah.toLowerCase().includes(userSchool.toLowerCase())
        );
      }
      setSearchResults(filtered);
    } catch (e) {
      console.error('Error searching siswa:', e);
      setSearchResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  async function handleAdd(s: SiswaItem) {
    if (data.some(d => d.nik === s.nik)) {
      setAddStatus({ ok: false, msg: `${s.nama} sudah terdaftar` });
      return;
    }
    setAdding(s.nik);
    setAddStatus(null);
    setSearchQuery('');
    setSearchResults([]);
    setSearched(false);
    try {
      if (!db) {
        const newItem: KipSdData = { id: Date.now().toString(), nik: s.nik, nama: s.nama, sekolah: s.sekolah, desa: s.desa, layak_pip: s.layak_pip, createdAt: Date.now() };
        setData(prev => [newItem, ...prev]);
      } else {
        await addDoc(collection(db, 'kip_sd'), { nik: s.nik, nama: s.nama, sekolah: s.sekolah, desa: s.desa, layak_pip: s.layak_pip, createdAt: Date.now() });
      }
      setAddStatus({ ok: true, msg: `${s.nama} ditambahkan sebagai penerima PIP` });
    } catch (e) {
      console.error('Error adding kip sd:', e);
      setAddStatus({ ok: false, msg: 'Gagal menambahkan data' });
    } finally {
      setAdding(null);
    }
  }

  async function handleDelete(id: string) {
    if (!db) {
      setData(prev => prev.filter(d => d.id !== id));
      return;
    }
    await deleteDoc(doc(db, 'kip_sd', id));
  }

  const filteredData = data.filter(d => {
    if (d.layak_pip !== 'Ya') return false;
    if (userSchool && !d.sekolah.toLowerCase().includes(userSchool.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 shadow-sm">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredData.length}</p>
        <p className="text-xs text-muted-foreground">Penerima PIP</p>
      </div>

      {addStatus && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${addStatus.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
          {addStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span>{addStatus.msg}</span>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <h3 className="font-semibold text-foreground">Cari Siswa SD</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama siswa..." value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setAddStatus(null); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cari
            </Button>
          </div>

          {searched && searchResults.length === 0 && (
            <p className="text-sm text-muted-foreground">Siswa tidak ditemukan</p>
          )}

          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
              {searchResults.map(s => {
                const isAlready = data.some(d => d.nik === s.nik);
                const isAdding = adding === s.nik;
                return (
                  <div key={s.nik} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.nama}</p>
                      <p className="text-xs text-muted-foreground">{s.nik} — {s.sekolah}</p>
                    </div>
                    <button
                      onClick={() => handleAdd(s)}
                      disabled={isAlready || isAdding}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                        isAlready ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300'
                      }`}
                    >
                      {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      {isAlready ? 'Sudah terdaftar' : 'Tambah'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/50">
          <p className="text-sm font-semibold text-foreground">Daftar Penerima PIP</p>
        </div>
        {filteredData.length === 0 ? (
          <AdminEmptyState icon={WalletMinimal} title="Belum ada data" description="Penerima PIP belum ditambahkan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIK</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sekolah</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Desa</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredData.map((d, i) => (
                  <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.nik}</td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{d.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{d.sekolah}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{d.desa}</td>
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
