'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Trash2, Loader2, FolderOpen, FileText } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import type { DokumenBersama } from '@/types';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getDocumentUrl(d: DokumenBersama) {
  const f = d.file;
  if (f && 'fileUrl' in f && f.fileUrl) return f.fileUrl;
  if (f && 'webViewLink' in f && f.webViewLink) return f.webViewLink;
  return d.downloadUrl || d.dataUrl || '#';
}

export default function SuperAdminDokumenPage() {
  const [allDocs, setAllDocs] = useState<DokumenBersama[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!db) { queueMicrotask(() => setLoading(false)); return; }
    const q = query(collection(db, 'dokumen'), orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: DokumenBersama[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DokumenBersama));
      setAllDocs(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return allDocs;
    const q = search.toLowerCase();
    return allDocs.filter(d =>
      d.nama?.toLowerCase().includes(q) ||
      d.nik?.includes(q) ||
      d.nip?.includes(q) ||
      d.fileName?.toLowerCase().includes(q)
    );
  }, [allDocs, search]);

  async function handleDelete(id: string) {
    if (!confirm('Hapus dokumen ini?')) return;
    if (!db) { setAllDocs(prev => prev.filter(d => d.id !== id)); return; }
    try { await deleteDoc(doc(db, 'dokumen', id)); }
    catch (e) { console.error('Gagal hapus:', e); }
  }

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Dokumen Bersama">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin/super" className="text-white/80 hover:text-white"><ArrowLeft className="w-5 h-5" /></a>
          <FolderOpen className="w-5 h-5 text-yellow-400" />
          <h1 className="text-lg font-bold text-white">Dokumen Bersama</h1>
        </div>
        <p className="text-sm text-blue-200">{allDocs.length} dokumen</p>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari NIP/NIK/nama/file..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border rounded-lg w-full bg-white dark:bg-gray-800" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">{search ? 'Tidak ada dokumen yang cocok' : 'Belum ada dokumen'}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIP/NIK</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">File</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Ukuran</th>
                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((d, i) => (
                    <tr key={d.id || i} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{d.nama}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.nip || d.nik || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[250px] truncate">
                        <a href={getDocumentUrl(d)} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline">{d.fileName}</a>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">{formatSize(d.fileSize)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDelete(d.id!)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">
              Menampilkan {filtered.length} dari {allDocs.length} dokumen
            </div>
          </div>
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
