'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Upload, Trash2, FileText, Download, Loader2, CheckCircle, XCircle, File } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy, onSnapshot } from 'firebase/firestore';
import type { DokumenBersama } from '@/types';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Compress image using Canvas API
async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<{ blob: Blob; type: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with reduced quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, type: file.type });
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function InputDokumenPage() {
  const { user } = useAppStore();
  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';
  const [nipSearch, setNipSearch] = useState('');
  const [pegawai, setPegawai] = useState<any | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [documents, setDocuments] = useState<DokumenBersama[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!db) {
      setDocuments([]);
      setDataLoaded(true);
      return;
    }
    const q = query(collection(db, 'dokumen'), orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: DokumenBersama[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DokumenBersama));
      setDocuments(list);
      setDataLoaded(true);
    }, () => { setDataLoaded(true); });
    return () => unsub();
  }, []);

  async function cariNIP() {
    const clean = nipSearch.replace(/\D/g, '');
    if (!clean) return;
    setSearchStatus('loading');
    setPegawai(null);
    try {
      const res = await fetch(`/api/pegawai/lookup?nip=${clean}`);
      const json = await res.json();
      if (json.found) {
        if (isOperator && userSchool && !json.pegawai.sekolah?.toLowerCase().includes(userSchool.toLowerCase())) {
          setSearchStatus('not_found');
          setPegawai(null);
        } else {
          setPegawai(json.pegawai);
          setSearchStatus('found');
        }
      } else {
        setSearchStatus('not_found');
      }
    } catch (e) {
      console.error('Error searching NIP:', e);
      setSearchStatus('not_found');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

   async function handleUpload() {
     if (!pegawai || files.length === 0) return;
     setUploading(true);
     setUploadStatus(null);

     const nip = pegawai.nip || nipSearch.replace(/\D/g, '');
     const uploaded: DokumenBersama[] = [];

     for (const file of files) {
       try {
         // Validate file size (max 10MB for documents, 5MB for images after compression)
         const isImage = file.type.startsWith('image/');
         const maxSize = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for others

         let fileToUpload = file;

         // Compress images if too large
         if (isImage && file.size > 2 * 1024 * 1024) { // >2MB
           toast.info(`Mengompres ${file.name} untuk mempercepat upload...`);
           fileToUpload = (await compressImage(file, 1920, 0.8)).blob;
         }

         if (fileToUpload.size > maxSize) {
           setUploadStatus({ ok: false, msg: `File "${file.name}" melebihi ukuran maksimum ${isImage ? '5MB' : '10MB'}` });
           setUploading(false);
           return;
         }

         if (storage && db) {
           const storagePath = `dokumen/${nip}/${Date.now()}_${file.name}`;
           const storageRef = ref(storage, storagePath);

           // Add metadata to uploaded documents
           const metadata = {
             contentType: fileToUpload.type,
             uploadedBy: pegawai.nama,
             nip: nip,
             category: 'dokumen',
             uploadedAt: Date.now(),
             originalSize: file.size,
             compressedSize: fileToUpload.size,
           };

           await uploadBytes(storageRef, fileToUpload, metadata);
           const downloadUrl = await getDownloadURL(storageRef);
           const docRef = await addDoc(collection(db, 'dokumen'), {
             nik: pegawai.nik || '',
             nip,
             nama: pegawai.nama,
             fileName: file.name,
             fileType: fileToUpload.type,
             fileSize: fileToUpload.size,
             storagePath,
             downloadUrl,
             uploadedAt: Date.now(),
           });
           uploaded.push({
             id: docRef.id,
             nik: pegawai.nik || '',
             nip,
             nama: pegawai.nama,
             fileName: file.name,
             fileType: fileToUpload.type,
             fileSize: fileToUpload.size,
             storagePath,
             downloadUrl,
             uploadedAt: Date.now(),
           });
         } else {
           // Mock mode: compress image if needed
           if (isImage && fileToUpload !== file) {
             const dataUrl = await fileToBase64(fileToUpload);
             const doc: DokumenBersama = {
               nik: pegawai.nik || '',
               nip,
               nama: pegawai.nama,
               fileName: file.name,
               fileType: fileToUpload.type,
               fileSize: fileToUpload.size,
               dataUrl,
               uploadedAt: Date.now(),
             };
             uploaded.push(doc);
           } else {
             const dataUrl = await fileToBase64(file);
             const doc: DokumenBersama = {
               nik: pegawai.nik || '',
               nip,
               nama: pegawai.nama,
               fileName: file.name,
               fileType: file.type,
               fileSize: file.size,
               dataUrl,
               uploadedAt: Date.now(),
             };
             uploaded.push(doc);
           }
         }
       } catch (e: any) {
         setUploadStatus({ ok: false, msg: `Gagal upload ${file.name}: ${e.message}` });
         setUploading(false);
         return;
       }
     }

    setUploadStatus({ ok: true, msg: `${files.length} dokumen berhasil diupload` });
    setFiles([]);
    setUploading(false);
  }

  async function handleDelete(docId: string) {
    if (db) {
      await deleteDoc(doc(db, 'dokumen', docId));
    } else {
      setDocuments(prev => prev.filter(d => d.id !== docId));
    }
  }

  function handleDownload(doc: DokumenBersama) {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, '_blank');
    } else if (doc.dataUrl) {
      const a = document.createElement('a');
      a.href = doc.dataUrl;
      a.download = doc.fileName;
      a.click();
    }
  }

  function makeBlobUrl(base64: string, type: string) {
    const byteStr = atob(base64.split(',')[1]);
    const ab = new ArrayBuffer(byteStr.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
    return URL.createObjectURL(new Blob([ab], { type }));
  }

  async function downloadAll() {
    const nip = nipSearch.replace(/\D/g, '');
    const filtered = documents.filter(d => d.nip === nip || d.nik === pegawai?.nik);
    for (const doc of filtered) {
      handleDownload(doc);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const filteredDocs = pegawai ? documents.filter(d => d.nip === (pegawai.nip || nipSearch.replace(/\D/g, '')) || d.nik === pegawai.nik) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-[#0d3b66]">Input Dokumen</h2>
      <p className="text-sm text-gray-500">Unggah dokumen berdasarkan NIP pegawai</p>
      {isOperator && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">Anda sebagai operator <strong>{userSchool}</strong> — hanya dapat mengelola dokumen pegawai di sekolah Anda.</p>
      )}

      {/* Search NIP */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-[#0d3b66]">Cari Pegawai</h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Masukkan NIP"
              value={nipSearch}
              onChange={e => { setNipSearch(e.target.value.replace(/\D/g, '')); setSearchStatus('idle'); }}
              className="pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full font-mono"
            />
          </div>
          <button
            onClick={cariNIP}
            disabled={!nipSearch || searchStatus === 'loading'}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-lg hover:bg-blue-900 disabled:opacity-50"
          >
            {searchStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Cari
          </button>
        </div>
        {searchStatus === 'found' && pegawai && (
          <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{pegawai.nama} - {pegawai.sekolah}</span>
          </div>
        )}
        {searchStatus === 'not_found' && (
          <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>NIP tidak ditemukan</span>
          </div>
        )}
      </div>

      {/* Upload */}
      {searchStatus === 'found' && pegawai && (
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-[#0d3b66]">Upload Dokumen</h3>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 border-2 border-dashed border-blue-200 w-full justify-center"
          >
            <Upload className="w-5 h-5" />
            Pilih File (PDF, Word, Excel, Gambar, dll)
          </button>
           <p className="text-xs text-gray-500 mt-1">Gambar &gt;2MB akan dikompres otomatis. Maks: 10MB (dokumen), 5MB (gambar setelah kompresi)</p>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{f.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">({formatSize(f.size)})</span>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload {files.length} File
              </button>
            </div>
          )}
          {uploadStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${uploadStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {uploadStatus.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {uploadStatus.msg}
            </div>
          )}
        </div>
      )}

      {/* Dokumen List */}
      {searchStatus === 'found' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-[#0d3b66]">Dokumen Tersimpan ({filteredDocs.length})</h3>
            {filteredDocs.length > 1 && (
              <button
                onClick={downloadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
              >
                <Download className="w-4 h-4" />
                Download Semua
              </button>
            )}
          </div>
          <div className="divide-y">
            {filteredDocs.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">Belum ada dokumen</p>
            ) : (
              filteredDocs.map((doc, i) => (
                <div key={doc.id || i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0d3b66] truncate">{doc.fileName}</p>
                      <p className="text-xs text-gray-400">{formatSize(doc.fileSize)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDownload(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Download className="w-4 h-4" />
                    </button>
                    {doc.id && (
                      <button onClick={() => handleDelete(doc.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
