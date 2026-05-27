'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Search, FileText, Download, Loader2, FolderOpen, AlertTriangle, DownloadCloud, Upload as UploadIcon, CheckCircle, XCircle } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { useAppStore } from '@/store/app-store';
import { apiAdd } from '@/lib/api-firestore';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [pegawai, setPegawai] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [documents, setDocuments] = useState<DokumenBersama[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ total: number; done: number; current: string } | null>(null);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAdmin = user && (user.role === 'super_admin' || user.role === 'operator_sekolah');

  async function cari() {
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setDocuments([]);
    setPegawai(null);
    setSearchResults(null);

    try {
      const isNip = /^\d+$/.test(q);
      let json: any;
      if (isNip) {
        const res = await fetch(`/api/pegawai/lookup?nip=${q}`);
        json = await res.json();
        if (json.found) {
          await pilihPegawai(json.pegawai);
          return;
        }
      }

      const res = await fetch(`/api/pegawai/lookup?search=${encodeURIComponent(q)}`);
      json = await res.json();
      if (json.found && json.results?.length === 1) {
        await pilihPegawai(json.results[0]);
      } else if (json.found && json.results?.length > 1) {
        setSearchResults(json.results);
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

  async function pilihPegawai(p: any) {
    setPegawai(p);
    setSearchResults(null);
    const nip = p.nip || '';
    if (nip) {
      const docsRes = await fetch(`/api/dokumen/list?nip=${nip}`);
      const docsJson = await docsRes.json();
      setDocuments(docsJson.documents || []);
    }
  }

  async function uploadSingle(file: File, token: string): Promise<string | null> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" — tipe file tidak diizinkan`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" — ukuran ${(file.size / (1024 * 1024)).toFixed(1)}MB melebihi batas 10MB`;
    }

    setBatchProgress(p => p ? { ...p, current: file.name } : null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('kategori', 'dokumen');
    formData.append('sekolahId', user?.schoolId || pegawai.schoolId || '');

    const uploadRes = await fetch('/api/drive/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.json();
      return `"${file.name}" — ${errData.error || 'Upload gagal'}`;
    }

    const uploadData = await uploadRes.json();
    const driveData = uploadData.data;

    await apiAdd('dokumen', {
      nik: pegawai.nik || '',
      nip: pegawai.nip || '',
      nama: pegawai.nama,
      sekolah: pegawai.sekolah || user?.schoolName || '',
      schoolId: pegawai.schoolId || user?.schoolId || '',
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      file: {
        provider: 'google_drive',
        driveFileId: driveData.driveFileId,
        fileName: driveData.fileName,
        originalName: file.name,
        fileUrl: driveData.webViewLink,
        webContentLink: driveData.webContentLink,
        mimeType: driveData.mimeType,
        size: driveData.size,
        uploadedAt: driveData.uploadedAt,
        uploadedBy: driveData.uploadedBy,
      },
      uploadedAt: new Date().toISOString(),
    });

    return null;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !pegawai) return;

    const match = document.cookie.match(/(^| )auth-token=([^;]+)/);
    const token = match?.[2];
    if (!token) {
      setUploadStatus({ ok: false, msg: 'Anda harus login untuk upload dokumen' });
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    setBatchProgress({ total: files.length, done: 0, current: '' });
    setBatchErrors([]);

    const errs: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const err = await uploadSingle(files[i], token);
      if (err) errs.push(err);
      setBatchProgress(p => p ? { ...p, done: i + 1 } : null);
    }

    setBatchErrors(errs);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';

    const okCount = files.length - errs.length;
    if (okCount > 0) {
      setUploadStatus({ ok: true, msg: `${okCount} file berhasil diupload.` });
      await cari();
    } else {
      setUploadStatus({ ok: false, msg: 'Semua file gagal diupload' });
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
          <p className="text-sm text-gray-500 mt-1">Cari dokumen berdasarkan NIP atau nama pegawai</p>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-[#0d3b66]">Cari Dokumen</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Masukkan NIP atau nama pegawai"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchResults(null); }}
                onKeyDown={e => e.key === 'Enter' && cari()}
                className="pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full"
              />
            </div>
            <button
              onClick={cari}
              disabled={!searchQuery.trim() || loading}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Cari
            </button>
          </div>
        </div>

        {searchResults && searchResults.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="text-sm font-semibold text-[#0d3b66]">Ditemukan {searchResults.length} pegawai</p>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {searchResults.map((p, i) => (
                <button
                  key={p.nip || i}
                  onClick={() => pilihPegawai(p)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                    {p.nama?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0d3b66] truncate">{p.nama}</p>
                    <p className="text-xs text-gray-500 truncate">{p.sekolah} {p.nip ? `• ${p.nip}` : ''}</p>
                  </div>
                  <span className="text-xs text-blue-600 shrink-0">Pilih</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {searched && !loading && !pegawai && !searchResults && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <p className="font-medium text-amber-800">Pegawai tidak ditemukan</p>
            <p className="text-sm text-amber-600 mt-1">Pastikan NIP atau nama yang dimasukkan benar</p>
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
            {isAdmin && (
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
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
                  {uploading ? 'Mengupload...' : 'Upload Dokumen'}
                </button>
              </div>
            )}
          </div>
        )}

        {batchProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="font-medium">Mengupload {batchProgress.total} file...</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }} />
              </div>
              <span className="text-xs font-mono shrink-0">{batchProgress.done}/{batchProgress.total}</span>
            </div>
            {batchProgress.current && (
              <p className="text-xs mt-1 text-blue-600 truncate">Sedang: {batchProgress.current}</p>
            )}
          </div>
        )}

        {uploadStatus && !batchProgress && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${uploadStatus.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {uploadStatus.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <div className="flex-1">
              <p className="font-medium">{uploadStatus.msg}</p>
              {batchErrors.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {batchErrors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600">{e}</li>
                  ))}
                </ul>
              )}
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
                <p className="text-gray-500 text-sm font-medium">Dokumen belum tersedia</p>
                <p className="text-gray-400 text-xs mt-1">Silahkan hubungi operator pada sekolah masing-masing</p>
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
