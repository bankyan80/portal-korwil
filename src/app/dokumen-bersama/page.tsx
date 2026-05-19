'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, FileText, Download, Loader2, FolderOpen, AlertTriangle, DownloadCloud, Upload as UploadIcon, CheckCircle, XCircle } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { db, auth } from '@/lib/firebase';
import { useAppStore } from '@/store/app-store';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import type { DokumenBersama } from '@/types';

function getIcon(type: string) {
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  if (type.includes('image')) return '🖼️';
  return '📁';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function DokumenBersamaPage() {
  const user = useAppStore((s) => s.user);
  const [nip, setNip] = useState('');
  const [pegawai, setPegawai] = useState<any | null>(null);
  const [documents, setDocuments] = useState<DokumenBersama[]>([]);
  const [allDocs, setAllDocs] = useState<DokumenBersama[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const isAdmin = user && (user.role === 'super_admin' || user.role === 'operator_sekolah');

  useEffect(() => {
    if (!db) { queueMicrotask(() => setDbReady(true)); return; }
    const q = query(collection(db, 'dokumen'), orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: DokumenBersama[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DokumenBersama));
      setAllDocs(list);
      setDbReady(true);
    }, () => {});
    return () => unsub();
  }, []);

  async function cari() {
    const clean = nip.replace(/\D/g, '');
    if (!clean) return;
    setLoading(true);
    setSearched(true);
    setDocuments([]);
    setPegawai(null);

    try {
      const res = await fetch(`/api/pegawai/lookup?nip=${clean}`);
      const json = await res.json();
      if (json.found) {
        setPegawai(json.pegawai);
        const filtered = allDocs.filter(d => d.nip === clean || d.nip === json.pegawai.nip);
        setDocuments(filtered);
      } else {
        setPegawai(null);
        setDocuments([]);
      }
    } catch (e) {
      console.error('Error searching pegawai:', e);
      setPegawai(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !pegawai || !db) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadStatus({ ok: false, msg: `Tipe file "${file.type}" tidak diizinkan. Gunakan PDF, Word, Excel, JPG/JPEG, PNG, WEBP, GIF, atau TIFF.` });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus({ ok: false, msg: `Ukuran file ${(file.size / (1024 * 1024)).toFixed(1)}MB melebihi batas 10MB.` });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    setUploadProgress('uploading');

    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        throw new Error('Anda harus login untuk upload dokumen');
      }

      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kategori', 'dokumen');
      formData.append('uploadedBy', currentUser.uid);

      setUploadProgress('uploading');
      const uploadRes = await fetch('/api/supabase/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Upload gagal');
      }

      const uploadData = await uploadRes.json();
      const supabaseData = uploadData.data;

      setUploadProgress('saving');
      await addDoc(collection(db!, 'dokumen'), {
        nik: pegawai.nik || '',
        nip: pegawai.nip || nip.replace(/\D/g, ''),
        nama: pegawai.nama,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        file: {
          provider: 'supabase',
          bucket: supabaseData.bucket,
          fileName: supabaseData.fileName,
          originalName: supabaseData.originalName,
          storagePath: supabaseData.storagePath,
          fileUrl: supabaseData.fileUrl,
          mimeType: supabaseData.mimeType,
          size: supabaseData.size,
          uploadedAt: supabaseData.uploadedAt,
          uploadedBy: supabaseData.uploadedBy,
        },
        uploadedAt: serverTimestamp(),
      });

      setUploadProgress('done');
      setUploadStatus({ ok: true, msg: `"${file.name}" berhasil diupload.` });
    } catch (err) {
      console.error('Upload gagal:', err);
      setUploadProgress('error');
      setUploadStatus({ ok: false, msg: err instanceof Error ? err.message : 'Upload gagal' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function downloadDoc(doc: DokumenBersama) {
    const f = doc.file;
    if (!f) return;
    if ('fileUrl' in f && f.fileUrl) {
      window.open(f.fileUrl, '_blank');
    } else if ('webViewLink' in f && f.webViewLink) {
      window.open(f.webViewLink, '_blank');
    } else if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank');
    } else if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.fileName;
      a.click();
    }
  }

  async function downloadAll() {
    for (const doc of documents) {
      downloadDoc(doc);
      await new Promise(r => setTimeout(r, 600));
    }
  }

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
              <FolderOpen className="w-5 h-5 text-yellow-400" />
              <h1 className="text-sm font-bold text-white uppercase tracking-wide">Dokumen Bersama</h1>
            </div>
            <div />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0d3b66]">Dokumen Bersama</h2>
          <p className="text-sm text-gray-500 mt-1">Cari dokumen berdasarkan NIP pegawai</p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-[#0d3b66]">Cari Dokumen</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Masukkan NIP (tanpa spasi)"
                value={nip}
                onChange={e => setNip(e.target.value.replace(/\s/g, ''))}
                onKeyDown={e => e.key === 'Enter' && cari()}
                className="pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full font-mono"
              />
            </div>
            <button
              onClick={cari}
              disabled={!nip || loading}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cari
            </button>
          </div>
        </div>

        {searched && !loading && !pegawai && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="font-medium text-amber-800">NIP tidak ditemukan</p>
            <p className="text-sm text-amber-600 mt-1">Pastikan NIP yang dimasukkan benar</p>
          </div>
        )}

        {pegawai && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
              {pegawai.nama.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[#0d3b66]">{pegawai.nama}</p>
              <p className="text-xs text-gray-500">{pegawai.sekolah} • {pegawai.jenis_ptk}</p>
            </div>
            {isAdmin && db && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadIcon className="w-4 h-4" />
                  )}
                  Upload Dokumen
                </button>
              </div>
            )}
          </div>
        )}

        {uploadStatus && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${uploadStatus.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {uploadStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <div className="flex-1">
              <p className="font-medium">{uploadStatus.msg}</p>
              {uploadProgress === 'uploading' && <p className="text-xs mt-1">Mengupload file...</p>}
              {uploadProgress === 'saving' && <p className="text-xs mt-1">Menyimpan metadata ke Firestore...</p>}
              {uploadProgress === 'done' && <p className="text-xs mt-1 text-green-600">File berhasil disimpan</p>}
              {uploadProgress === 'error' && <p className="text-xs mt-1 text-red-600">Silakan coba lagi</p>}
            </div>
          </div>
        )}

        {pegawai && (
          <div className="space-y-3">
            {documents.length > 1 && (
              <div className="flex justify-end">
                <button
                  onClick={downloadAll}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900"
                >
                  <DownloadCloud className="w-4 h-4" />
                  Download Semua ({documents.length})
                </button>
              </div>
            )}

            {documents.length === 0 ? (
              <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Belum ada dokumen</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, i) => (
                  <div key={doc.id || i} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col">
                    <div className="text-3xl mb-3">{getIcon(doc.fileType)}</div>
                    <p className="text-sm font-medium text-[#0d3b66] truncate mb-1" title={doc.fileName}>{doc.fileName}</p>
                    <p className="text-xs text-gray-400 mb-3">{formatSize(doc.fileSize)}</p>
                    {doc.file && (
                      <p className="text-[10px] text-green-600 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {'provider' in doc.file && doc.file.provider === 'supabase' ? 'Supabase Storage' : 'Google Drive'}
                      </p>
                    )}
                    <div className="mt-auto">
                      <button
                        onClick={() => downloadDoc(doc)}
                        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
