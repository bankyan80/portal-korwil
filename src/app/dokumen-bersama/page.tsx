'use client';

import { useState } from 'react';
import { ArrowLeft, Search, FileText, Loader2, FolderOpen, AlertTriangle, ExternalLink } from 'lucide-react';
import Footer from '@/components/portal/Footer';

const DOC_ICONS: Record<string, string> = {
  'IJAZAH TERAKHIR': '🎓', 'IJAZAH': '🎓', 'IJAZAH + TRANSKRIP': '🎓',
  'SK PPPK': '📜', 'SK PPPK PW': '📜', 'SK PNS/P3K': '📜', 'SK KGB': '📜', 'SK CPNS': '📜', 'SK PANGKAT': '📜',
  'SK JABATAN': '📋', 'SK PENUGASAN KEPSEK': '📋', 'SK KEPSEK': '📋', 'SKP/DP3 2021': '📋',
  'KARPEG': '🪪', 'KARIS/KARSU': '🪪',
  'KTP': '🆔', 'KARTU KELUARGA': '👨‍👩‍👧‍👦', 'AKTA NIKAH': '💍', 'SURAT TUGAS': '📋',
  'SERTIFIKAT PENDIDIK': '📜', 'SERTIFIKAT DIKLAT': '📜',
  'DOKUMEN LAIN': '📁', 'DOKUMEN LAINNYA': '📁',
  'NPWP': '📄', 'BPJS KESEHATAN': '🏥', 'IDENTITAS DIRI': '🪪', 'DATA KELUARGA': '👨‍👩‍👧‍👦',
  'DOKUMEN KOMPETENSI': '📚', 'PAS FOTO': '📸',   'FOTO ASN PPPK': '📸',
  'FOLDER DOKUMEN': '📂',
};

const DOC_LABELS: Record<string, string> = {
  'IJAZAH TERAKHIR': 'Ijazah', 'IJAZAH': 'Ijazah', 'IJAZAH + TRANSKRIP': 'Ijazah + Transkrip',
  'SK PPPK': 'SK PPPK', 'SK PPPK PW': 'SK PPPK PW', 'SK PNS/P3K': 'SK PNS/P3K',
  'SK KGB': 'SK KGB', 'SK CPNS': 'SK CPNS', 'SK PANGKAT': 'SK Pangkat', 'SK JABATAN': 'SK Jabatan',
  'SK PENUGASAN KEPSEK': 'SK Penugasan KEPSEK', 'SK KEPSEK': 'SK Kepala Sekolah',
  'SKP/DP3 2021': 'SKP/DP3 2021',
  'KARPEG': 'Karpeg', 'KARIS/KARSU': 'Karis/Karsu',
  'KTP': 'KTP', 'KARTU KELUARGA': 'Kartu Keluarga', 'AKTA NIKAH': 'Akta Nikah', 'SURAT TUGAS': 'Surat Tugas',
  'SERTIFIKAT PENDIDIK': 'Sertifikat Pendidik', 'SERTIFIKAT DIKLAT': 'Sertifikat Diklat',
  'DOKUMEN LAIN': 'Dokumen Lain', 'DOKUMEN LAINNYA': 'Dokumen Lainnya',
  'NPWP': 'NPWP', 'BPJS KESEHATAN': 'BPJS Kesehatan',
  'IDENTITAS DIRI': 'Identitas Diri', 'DATA KELUARGA': 'Data Keluarga',
  'DOKUMEN KOMPETENSI': 'Dokumen Kompetensi', 'PAS FOTO': 'Pas Foto',   'FOTO ASN PPPK': 'Foto ASN PPPK',
  'FOLDER DOKUMEN': 'Folder Dokumen',
};

export default function DokumenBersamaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pegawai, setPegawai] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [documents, setDocuments] = useState<{ type: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [searched, setSearched] = useState(false);

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
    setLoadingDoc(true);
    const nip = p.nip || '';
    try {
      let url = `/api/dokumen/sheet?nip=${nip}&nama=${encodeURIComponent(p.nama)}`;
      if (p.nik) url += `&nik=${p.nik}`;
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
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                {pegawai.nama.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#0d3b66]">{pegawai.nama}</p>
                <p className="text-xs text-gray-500">{pegawai.sekolah} {pegawai.jenis_ptk ? `• ${pegawai.jenis_ptk}` : ''}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#0d3b66] flex items-center gap-2">
                Dokumen Tersimpan
                {loadingDoc ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <span className="text-sm font-normal text-gray-500">({documents.length})</span>
                )}
              </h3>

              {!loadingDoc && documents.length === 0 && (
                <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm font-medium">Dokumen belum tersedia</p>
                  <p className="text-gray-400 text-xs mt-1">Silahkan hubungi operator pada sekolah masing-masing</p>
                </div>
              )}

              {!loadingDoc && documents.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents
                    .sort((a, b) => a.type.localeCompare(b.type))
                    .map((doc, i) => (
                      <a
                        key={`${doc.type}-${i}`}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-green-200 shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col"
                      >
                        <div className="text-3xl mb-3">{DOC_ICONS[doc.type] || '📄'}</div>
                        <p className="text-sm font-medium text-green-800 truncate mb-1" title={DOC_LABELS[doc.type] || doc.type}>
                          {DOC_LABELS[doc.type] || doc.type}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">Tersedia</p>
                        <div className="mt-auto">
                          <span className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                            Buka
                          </span>
                        </div>
                      </a>
                    ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
