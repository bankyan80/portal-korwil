'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiSet, apiDelete } from '@/lib/api-firestore';
import { allSekolah } from '@/data/sekolah';
import { FolderOpen, ExternalLink, Check, X, Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { normalizeSchool } from '@/lib/normalize';

function extractFolderId(url: string): string {
  const m = url.match(/[a-zA-Z0-9_-]{25,}/);
  return m ? m[0] : url;
}

interface DriveMapping {
  id: string;
  npsn: string;
  schoolName: string;
  folderId: string;
  folderUrl: string;
  updatedAt: number;
}

export function SuperDriveMapping() {
  const [mappings, setMappings] = useState<Record<string, DriveMapping>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiGet('drive_folders').then((res) => {
      const map: Record<string, DriveMapping> = {};
      for (const item of (res?.items || [])) {
        map[item.npsn] = { id: item.id, ...item };
      }
      setMappings(map);
      setLoading(false);
    }).catch(() => {
      toast.error('Gagal memuat mapping Drive');
      setLoading(false);
    });
  }, []);

  const sekolahList = allSekolah
    .filter(s => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.nama.toLowerCase().includes(q) || s.npsn.includes(q) || s.desa.toLowerCase().includes(q);
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));

  async function handleSave(npsn: string, sekolah: string) {
    const raw = editing[npsn] || '';
    if (!raw.trim()) {
      toast.error('Masukkan folder ID atau URL');
      return;
    }
    const folderId = extractFolderId(raw);
    setSaving(npsn);
    try {
      const data: DriveMapping = {
        npsn,
        schoolName: sekolah,
        folderId,
        folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
        updatedAt: Date.now(),
      };
      await apiSet('drive_folders', npsn, data);
      setMappings(m => ({ ...m, [npsn]: { ...data, id: npsn } }));
      setEditing(e => { const n = { ...e }; delete n[npsn]; return n; });
      toast.success(`Mapping tersimpan untuk ${sekolah}`);
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(npsn: string) {
    try {
      await apiDelete('drive_folders', npsn);
      setMappings(m => { const n = { ...m }; delete n[npsn]; return n; });
      toast.success('Mapping dihapus');
    } catch {
      toast.error('Gagal menghapus');
    }
  }

  const mappedCount = Object.keys(mappings).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {mappedCount} dari {allSekolah.length} sekolah sudah punya folder Drive
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Cari sekolah:</span>
          <Input
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            placeholder="Nama / NPSN / Desa..."
            className="w-56 h-8 text-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sekolah</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NPSN</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jenjang</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Folder ID / URL</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {sekolahList.map((s) => {
                const m = mappings[s.npsn];
                const isEditing = s.npsn in editing;
                const inputVal = editing[s.npsn] ?? m?.folderUrl ?? m?.folderId ?? '';

                return (
                  <tr key={s.npsn} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{s.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.npsn}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.jenjang === 'SD' ? 'bg-blue-100 text-blue-700' :
                        s.jenjang === 'TK' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                      }`}>{s.jenjang}</span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing || !m ? (
                        <div className="flex gap-2">
                          <Input
                            value={inputVal}
                            onChange={(e: any) => setEditing(e2 => ({ ...e2, [s.npsn]: e.target.value }))}
                            placeholder="Folder ID atau URL Google Drive"
                            className="h-8 text-xs flex-1 min-w-[200px]"
                          />
                          {isEditing && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                              const n = { ...editing }; delete n[s.npsn]; setEditing(n);
                            }}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <a href={m.folderUrl} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs">
                          <FolderOpen className="w-3 h-3" />
                          {m.folderId.substring(0, 20)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Check className="w-3 h-3" /> Tersimpan
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => handleSave(s.npsn, s.nama)}
                          disabled={saving === s.npsn}
                        >
                          {saving === s.npsn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        </Button>
                        {m && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => handleDelete(s.npsn)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sekolahList.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada sekolah ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t dark:border-gray-700 text-xs text-muted-foreground">
          {sekolahList.length === allSekolah.length
            ? `Total ${allSekolah.length} sekolah`
            : `${sekolahList.length} dari ${allSekolah.length} sekolah (difilter)`}
        </div>
      </div>
    </div>
  );
}
