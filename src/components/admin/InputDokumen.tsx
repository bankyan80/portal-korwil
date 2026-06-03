'use client';

import { useState } from 'react';
import { Search, ExternalLink, FileText, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

const DOC_ICONS: Record<string, string> = {
  'IJAZAH TERAKHIR': '🎓',
  'IJAZAH': '🎓',
  'IJAZAH + TRANSKRIP': '🎓',
  'SK PPPK': '📜',
  'SK PPPK PW': '📜',
  'SK PNS/P3K': '📜',
  'SK KGB': '📜',
  'SK CPNS': '📜',
  'SK PANGKAT': '📜',
  'SK JABATAN': '📋',
  'SK PENUGASAN KEPSEK': '📋',
  'SK KEPSEK': '📋',
  'SKP/DP3 2021': '📋',
  'KARPEG': '🪪',
  'KARIS/KARSU': '🪪',
  'KTP': '🆔',
  'KARTU KELUARGA': '👨‍👩‍👧‍👦',
  'AKTA NIKAH': '💍',
  'SURAT TUGAS': '📋',
  'SERTIFIKAT PENDIDIK': '📜',
  'SERTIFIKAT DIKLAT': '📜',
  'DOKUMEN LAIN': '📁',
  'DOKUMEN LAINNYA': '📁',
  'NPWP': '📄',
  'BPJS KESEHATAN': '🏥',
  'IDENTITAS DIRI': '🪪',
  'DATA KELUARGA': '👨‍👩‍👧‍👦',
  'DOKUMEN KOMPETENSI': '📚',
  'PAS FOTO': '📸',
  'FOTO ASN PPPK': '📸',
};

const DOC_LABELS: Record<string, string> = {
  'IJAZAH TERAKHIR': 'Ijazah',
  'IJAZAH': 'Ijazah',
  'IJAZAH + TRANSKRIP': 'Ijazah + Transkrip',
  'SK PPPK': 'SK PPPK',
  'SK PPPK PW': 'SK PPPK PW',
  'SK PNS/P3K': 'SK PNS/P3K',
  'SK KGB': 'SK KGB',
  'SK CPNS': 'SK CPNS',
  'SK PANGKAT': 'SK Pangkat',
  'SK JABATAN': 'SK Jabatan',
  'SK PENUGASAN KEPSEK': 'SK Penugasan KEPSEK',
  'SK KEPSEK': 'SK Kepala Sekolah',
  'SKP/DP3 2021': 'SKP/DP3 2021',
  'KARPEG': 'Karpeg',
  'KARIS/KARSU': 'Karis/Karsu',
  'KTP': 'KTP',
  'KARTU KELUARGA': 'Kartu Keluarga',
  'AKTA NIKAH': 'Akta Nikah',
  'SURAT TUGAS': 'Surat Tugas',
  'SERTIFIKAT PENDIDIK': 'Sertifikat Pendidik',
  'SERTIFIKAT DIKLAT': 'Sertifikat Diklat',
  'DOKUMEN LAIN': 'Dokumen Lain',
  'DOKUMEN LAINNYA': 'Dokumen Lainnya',
  'NPWP': 'NPWP',
  'BPJS KESEHATAN': 'BPJS Kesehatan',
  'IDENTITAS DIRI': 'Identitas Diri',
  'DATA KELUARGA': 'Data Keluarga',
  'DOKUMEN KOMPETENSI': 'Dokumen Kompetensi',
  'PAS FOTO': 'Pas Foto',
  'FOTO ASN PPPK': 'Foto ASN PPPK',
};

export default function InputDokumenPage() {
  const { user } = useAppStore();
  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';
  const [nipSearch, setNipSearch] = useState('');
  const [pegawai, setPegawai] = useState<any | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [documents, setDocuments] = useState<{ type: string; url: string }[]>([]);
  const [loadingDoc, setLoadingDoc] = useState(false);

  async function cariNIP() {
    const clean = nipSearch.replace(/\D/g, '');
    if (!clean) return;
    setSearchStatus('loading');
    setPegawai(null);
    setDocuments([]);
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
          loadDocuments(clean, json.pegawai.nama, json.pegawai.nik);
        }
      } else {
        setSearchStatus('not_found');
      }
    } catch (e) {
      console.error('Error searching NIP:', e);
      setSearchStatus('not_found');
    }
  }

  async function loadDocuments(nip: string, nama: string, nik?: string) {
    setLoadingDoc(true);
    try {
      let url = `/api/dokumen/sheet?nip=${nip}&nama=${encodeURIComponent(nama)}`;
      if (nik) url += `&nik=${nik}`;
      const res = await fetch(url);
      const json = await res.json();
      setDocuments(json.documents || []);
    } catch (e) {
      console.error('Error loading documents:', e);
      setDocuments([]);
    } finally {
      setLoadingDoc(false);
    }
  }

  const docMap = new Map(documents.map(d => [d.type, d.url]));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-[#0d3b66]">Dokumen Pegawai</h2>
      <p className="text-sm text-gray-500">Cari dokumen pegawai — data dari 4 Google Form</p>
      {isOperator && (
        <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
          Anda sebagai operator <strong>{userSchool}</strong> — hanya dapat melihat dokumen pegawai di sekolah Anda.
        </p>
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
              onKeyDown={e => e.key === 'Enter' && cariNIP()}
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

      {/* Document Grid */}
      {searchStatus === 'found' && (
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#0d3b66]">
              Dokumen Tersimpan
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({documents.length})
              </span>
            </h3>
            {loadingDoc && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </div>

          {!loadingDoc && documents.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Belum ada dokumen yang diupload</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from(docMap.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([type, url]) => (
                <a
                  key={type}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <span className="text-lg">{DOC_ICONS[type] || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">
                      {DOC_LABELS[type] || type}
                    </p>
                    <p className="text-xs text-gray-400">Tersedia</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-green-600 shrink-0" />
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
