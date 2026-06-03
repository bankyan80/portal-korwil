'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, ExternalLink, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { apiGet, apiAdd, apiDelete } from '@/lib/api-firestore';
import type { DokumenBersama } from '@/types';

const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/u/0/folders/1F-Z8diPzKM0VeM2I3khpk0d3PBAFeUWiFSoNo2L5upq5W2hgaOndQoyzQRwNLWYNiejkP57B';

export default function InputDokumenPage() {
  const { user } = useAppStore();
  const userSchool = user?.schoolName || '';
  const isOperator = user?.role === 'operator_sekolah';
  const [nipSearch, setNipSearch] = useState('');
  const [pegawai, setPegawai] = useState<any | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [documents, setDocuments] = useState<DokumenBersama[]>([]);
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  async function fetchData() {
    try {
      const json = await apiGet('dokumen', { orderBy: { field: 'uploadedAt', dir: 'desc' } });
      setDocuments(json.items || []);
    } catch (err) {
      console.error('Error loading dokumen:', err);
      toast.error('Gagal memuat data dokumen');
    } finally {
      setDataLoaded(true);
    }
  }

  useEffect(() => {
    fetchData();
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

  async function handleSave() {
    if (!pegawai || !fileName.trim()) return;
    setSaving(true);
    setSaveStatus(null);
    const nip = pegawai.nip || nipSearch.replace(/\D/g, '');
    try {
      await apiAdd('dokumen', {
        nik: pegawai.nik || '',
        nip,
        nama: pegawai.nama,
        fileName: fileName.trim(),
        uploadedAt: Date.now(),
      });
      setSaveStatus({ ok: true, msg: `Dokumen "${fileName.trim()}" berhasil disimpan` });
      setFileName('');
      await fetchData();
    } catch (e: any) {
      setSaveStatus({ ok: false, msg: `Gagal menyimpan: ${e.message}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(docId: string) {
    try {
      await apiDelete('dokumen', docId);
      await fetchData();
    } catch (e) { console.error('Error deleting dokumen:', e); }
  }

  const filteredDocs = pegawai ? documents.filter(d => d.nip === (pegawai.nip || nipSearch.replace(/\D/g, '')) || d.nik === pegawai.nik) : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-[#0d3b66]">Input Dokumen</h2>
      <p className="text-sm text-gray-500">Catat dokumen pegawai berdasarkan NIP</p>
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

      {/* Input Metadata */}
      {searchStatus === 'found' && pegawai && (
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-[#0d3b66]">Catat Dokumen</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nama file dokumen..."
              value={fileName}
              onChange={e => { setFileName(e.target.value); setSaveStatus(null); }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              onClick={handleSave}
              disabled={saving || !fileName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Simpan
            </button>
          </div>
          <a
            href={DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            <ExternalLink className="w-3 h-3" />
            Buka Folder Google Drive
          </a>
          {saveStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${saveStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {saveStatus.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {saveStatus.msg}
            </div>
          )}
        </div>
      )}

      {/* Dokumen List */}
      {searchStatus === 'found' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-[#0d3b66]">Dokumen Tersimpan ({filteredDocs.length})</h3>
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
                      <p className="text-xs text-gray-400">dicatat {new Date(doc.uploadedAt || Date.now()).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={DRIVE_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
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
