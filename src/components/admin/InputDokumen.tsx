'use client';

import { useState } from 'react';
import { Search, ExternalLink, FileText, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

type DocumentEntry = {
  type: string;
  url: string;
};

const DOC_TYPES = [
  { key: 'IJAZAH TERAKHIR', icon: '🎓', label: 'Ijazah' },
  { key: 'SK PPPK', icon: '📜', label: 'SK PPPK' },
  { key: 'SK KGB', icon: '📜', label: 'SK KGB' },
  { key: 'KARPEG/KARTU VIRTUAL ASN', icon: '🪪', label: 'Karpeg' },
  { key: 'KARIS/KARSU', icon: '🪪', label: 'Karis/Karsu' },
  { key: 'KTP', icon: '🆔', label: 'KTP' },
  { key: 'KARTU KELUARGA', icon: '👨‍👩‍👧‍👦', label: 'KK' },
  { key: 'KARTU/AKTA NIKAH', icon: '💍', label: 'Akta Nikah' },
  { key: 'SURAT TUGAS (MUTASI)', icon: '📋', label: 'Surat Tugas' },
  { key: 'SERTIFIKAT PENDIDIK (GURU)', icon: '📜', label: 'Sertifikat Pendidik' },
  { key: 'SK KEPALA SEKOLAH (SKBM)', icon: '📋', label: 'SK Kepala Sekolah' },
  { key: 'DOKUMEN LAINNYA', icon: '📁', label: 'Dokumen Lain' },
];

export default function InputDokumenPage() {
  const { user } = useAppStore();
  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';
  const [nipSearch, setNipSearch] = useState('');
  const [pegawai, setPegawai] = useState<any | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
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
          loadDocuments(clean);
        }
      } else {
        setSearchStatus('not_found');
      }
    } catch (e) {
      console.error('Error searching NIP:', e);
      setSearchStatus('not_found');
    }
  }

  async function loadDocuments(nip: string) {
    setLoadingDoc(true);
    try {
      const res = await fetch(`/api/dokumen/sheet?nip=${nip}`);
      const json = await res.json();
      if (json.found) {
        setDocuments(json.documents || []);
      } else {
        setDocuments([]);
      }
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
      <p className="text-sm text-gray-500">Cari dokumen pegawai berdasarkan NIP — data dari Google Form</p>
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
                ({documents.length}/12)
              </span>
            </h3>
            {loadingDoc && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
          </div>

          {!loadingDoc && documents.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Belum ada dokumen yang diupload melalui Google Form</p>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfY5q4dS7vF5sVf5sVf5sVf5sVf5sVf5sVf5sVf5sVf5sVf5sVf5sVf5/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Buka Google Form
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {DOC_TYPES.map(({ key, icon, label }) => {
              const url = docMap.get(key);
              return (
                <a
                  key={key}
                  href={url || '#'}
                  target={url ? '_blank' : undefined}
                  rel={url ? 'noopener noreferrer' : undefined}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    url
                      ? 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer'
                      : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${url ? 'text-green-800' : 'text-gray-400'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-400">
                      {url ? 'Tersedia' : 'Belum diupload'}
                    </p>
                  </div>
                  {url && <ExternalLink className="w-4 h-4 text-green-600 shrink-0" />}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
