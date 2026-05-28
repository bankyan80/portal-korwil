'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Search, Loader2, FolderOpen, FileText, ChevronDown, X,
  Upload, Download, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { apiGet, apiAdd, apiDelete } from '@/lib/api-firestore';
import AuthGuard from '@/components/auth/AuthGuard';
import { allSekolah } from '@/data/sekolah';
import type { DokumenBersama } from '@/types';

const negeriSekolah = allSekolah.filter(s => s.status === 'NEGERI').map(s => s.nama).sort();

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => { if (blob) resolve(blob); else reject(new Error('Compress failed')); }, file.type, quality);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function DokumenModal({ pegawai, onClose }: { pegawai: any; onClose: () => void }) {
  const [documents, setDocuments] = useState<DokumenBersama[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const nip = pegawai.nip || '';

  const fetchDocs = useCallback(async () => {
    if (!nip) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/dokumen/list?nip=${nip}`);
      const json = await res.json();
      setDocuments(json.documents || []);
    } catch { } finally { setLoading(false); }
  }, [nip]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function uploadFiles(files: FileList) {
    setUploading(true);
    setUploadStatus(null);

    const cookieMatch = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
    const token = cookieMatch?.[1] || '';
    if (!token) { setUploadStatus({ ok: false, msg: 'Anda harus login' }); setUploading(false); return; }

    let ok = 0;
    const errs: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const isImage = file.type.startsWith('image/');
        let fileToUpload: File | Blob = file;
        if (isImage && file.size > 2 * 1024 * 1024) fileToUpload = await compressImage(file);

        const formData = new FormData();
        formData.append('file', fileToUpload, file.name);
        formData.append('kategori', 'dokumen');

        const uploadRes = await fetch('/api/drive/upload', {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
        });
        if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || 'Upload gagal');
        const driveData = (await uploadRes.json()).data;

        await apiAdd('dokumen', {
          nik: pegawai.nik || '', nip, nama: pegawai.nama, sekolah: pegawai.sekolah || '',
          fileName: file.name, fileType: fileToUpload.type || file.type, fileSize: fileToUpload.size,
          file: {
            provider: 'google_drive', driveFileId: driveData.driveFileId, fileName: driveData.fileName,
            originalName: file.name, fileUrl: driveData.webViewLink, webContentLink: driveData.webContentLink,
            mimeType: driveData.mimeType, size: driveData.size, uploadedAt: driveData.uploadedAt,
            uploadedBy: driveData.uploadedBy,
          },
          uploadedAt: Date.now(),
        });
        ok++;
      } catch (e: any) { errs.push(`${file.name}: ${e.message}`); }
    }

    const parts: string[] = [];
    if (ok > 0) parts.push(`${ok} berhasil`);
    if (errs.length > 0) parts.push(`${errs.length} gagal`);
    setUploadStatus({ ok: errs.length === 0, msg: parts.join(', ') || 'Tidak ada file diupload' });
    setUploading(false);
    await fetchDocs();
  }

  async function handleDelete(docId: string) {
    try { await apiDelete('dokumen', docId); await fetchDocs(); } catch { }
  }

  function handleDownload(doc: DokumenBersama) {
    const f = doc.file;
    if (!f) return;
    const url = 'fileUrl' in f && f.fileUrl ? f.fileUrl : 'webViewLink' in f && f.webViewLink ? f.webViewLink : null;
    if (url) window.open(url, '_blank');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-[#0d3b66]">{pegawai.nama}</h2>
            <p className="text-xs text-gray-500">{pegawai.nip || pegawai.nik || ''} — {pegawai.sekolah || ''}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-[#0d3b66]">Upload Dokumen</h3>
            <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
              onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files); e.target.value = ''; }}
              className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 border-2 border-dashed border-blue-200 w-full justify-center disabled:opacity-50">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploading ? 'Mengupload...' : 'Pilih File (auto-upload)'}
            </button>
            {uploadStatus && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${uploadStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {uploadStatus.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {uploadStatus.msg}
              </div>
            )}
          </div>

          {/* Daftar Dokumen */}
          <div>
            <h3 className="font-semibold text-sm text-[#0d3b66] mb-3">Dokumen Tersimpan ({documents.length})</h3>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : documents.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Belum ada dokumen</p>
            ) : (
              <div className="divide-y border rounded-lg">
                {documents.map((doc, i) => (
                  <div key={doc.id || i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        <p className="text-xs text-gray-400">{formatSize(doc.fileSize)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleDownload(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Download className="w-4 h-4" /></button>
                      {doc.id && <button onClick={() => handleDelete(doc.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDokumenPage() {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [pegawaiList, setPegawaiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPegawai, setSelectedPegawai] = useState<any | null>(null);

  useEffect(() => {
    if (!selectedSchool) { setPegawaiList([]); return; }
    setLoading(true);
    fetch(`/api/pegawai/lookup?sekolah=${encodeURIComponent(selectedSchool)}`)
      .then(r => r.json())
      .then(json => setPegawaiList(json.results || []))
      .catch(() => setPegawaiList([]))
      .finally(() => setLoading(false));
  }, [selectedSchool]);

  const filtered = search
    ? pegawaiList.filter(e =>
        (e.nama || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.nik || '').includes(search) ||
        (e.nip || '').includes(search)
      )
    : pegawaiList;

  return (
    <AuthGuard requiredRoles={['super_admin']} requireActive featureName="Dokumen Pegawai">
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin/super" className="text-white/80 hover:text-white"><ArrowLeft className="w-5 h-5" /></a>
          <FolderOpen className="w-5 h-5 text-yellow-400" />
          <h1 className="text-lg font-bold text-white">Dokumen Pegawai</h1>
        </div>
        <p className="text-sm text-blue-200">{pegawaiList.length} pegawai</p>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 pr-8 min-w-[300px]">
              <option value="">Pilih Sekolah Negeri</option>
              {negeriSekolah.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {selectedSchool && (
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari nama/NIP/NIK..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm border rounded-lg w-full bg-white dark:bg-gray-800" />
            </div>
          )}
        </div>

        {!selectedSchool ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Pilih sekolah untuk melihat daftar pegawai</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">{search ? 'Tidak ada pegawai yang cocok' : 'Belum ada pegawai di sekolah ini'}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-12">No</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIP</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NUPTK</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Jabatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((e, i) => (
                    <tr key={e.nik || e.nip || i}
                      className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => setSelectedPegawai(e)}>
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap underline underline-offset-2 decoration-dotted">
                        {e.nama}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.nip || '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.nuptk || '-'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{e.jabatan || e.jenis_ptk || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">
              Menampilkan {filtered.length} pegawai
            </div>
          </div>
        )}

        {selectedPegawai && (
          <DokumenModal pegawai={selectedPegawai} onClose={() => setSelectedPegawai(null)} />
        )}
      </main>
    </div>
    </AuthGuard>
  );
}
