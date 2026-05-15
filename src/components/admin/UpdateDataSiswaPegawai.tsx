'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Upload, FileText, CheckCircle2, XCircle, Loader2, Database, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ImportType = 'siswa' | 'pegawai';
type ImportStatus = 'IDLE' | 'ANALISA' | 'STRUKTUR' | 'VERIFIKASI' | 'UPDATE' | 'AUTO_SAVE' | 'DONE' | 'ERROR';

interface ImportResult {
  total: number;
  success: number;
  errors: { row: number; message: string }[];
  collection: string;
}

const STEPS: ImportStatus[] = ['ANALISA', 'STRUKTUR', 'VERIFIKASI', 'UPDATE', 'AUTO_SAVE'];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function extractName(row: string[]): string {
  return (row[1] || '').trim();
}

function extractNIK(row: string[]): string {
  return (row[44] || '').trim();
}

function extractSiswaRecord(cols: string[], sekolah: string) {
  const nik = (cols[7] || '').trim();
  if (!nik) return null;

  const get = (i: number) => (cols[i] || '').trim();

  const dataAyah: Record<string, string> = {};
  if (get(24)) dataAyah.nama = get(24);
  if (get(25)) dataAyah.tahun_lahir = get(25);
  if (get(26)) dataAyah.pendidikan = get(26);
  if (get(27)) dataAyah.pekerjaan = get(27);
  if (get(28)) dataAyah.penghasilan = get(28);
  if (get(29)) dataAyah.nik = get(29);

  const dataIbu: Record<string, string> = {};
  if (get(30)) dataIbu.nama = get(30);
  if (get(31)) dataIbu.tahun_lahir = get(31);
  if (get(32)) dataIbu.pendidikan = get(32);
  if (get(33)) dataIbu.pekerjaan = get(33);
  if (get(34)) dataIbu.penghasilan = get(34);
  if (get(35)) dataIbu.nik = get(35);

  const dataWali: Record<string, string> = {};
  if (get(36)) dataWali.nama = get(36);
  if (get(37)) dataWali.tahun_lahir = get(37);
  if (get(38)) dataWali.pendidikan = get(38);
  if (get(39)) dataWali.pekerjaan = get(39);
  if (get(40)) dataWali.penghasilan = get(40);
  if (get(41)) dataWali.nik = get(41);

  const rombel = get(42);
  const kelas = rombel ? parseInt(rombel.replace(/\D/g, ''), 10) || null : null;

  const lintang = get(58) ? parseFloat(get(58).replace(',', '.')) || null : null;
  const bujur = get(59) ? parseFloat(get(59).replace(',', '.')) || null : null;

  const parseIntSafe = (v: string): number | null => {
    if (!v || v === '-') return null;
    const n = parseInt(v.replace(',', '.'), 10);
    return isNaN(n) ? null : n;
  };

  return {
    nik,
    nama: get(1),
    nipd: get(2),
    jk: get(3),
    nisn: get(4),
    tempat_lahir: get(5),
    tanggal_lahir: get(6),
    agama: get(8),
    alamat: get(9),
    rt: get(10),
    rw: get(11),
    dusun: get(12),
    desa: get(13),
    kecamatan: get(14),
    kode_pos: get(15),
    jenis_tinggal: get(16),
    alat_transportasi: get(17),
    telepon: get(18),
    hp: get(19),
    email: get(20),
    skhun: get(21),
    penerima_kps: get(22),
    no_kps: get(23),
    data_ayah: Object.keys(dataAyah).length > 0 ? dataAyah : null,
    data_ibu: Object.keys(dataIbu).length > 0 ? dataIbu : null,
    data_wali: Object.keys(dataWali).length > 0 ? dataWali : null,
    rombel,
    kelas,
    no_peserta_ujian: get(43),
    no_seri_ijazah: get(44),
    penerima_kip: get(45),
    nomor_kip: get(46),
    nama_di_kip: get(47),
    nomor_kks: get(48),
    no_reg_akta_lahir: get(49),
    bank: get(50),
    nomor_rekening: get(51),
    rekening_atas_nama: get(52),
    layak_pip: get(53),
    alasan_layak_pip: get(54),
    kebutuhan_khusus: get(55),
    sekolah_asal: get(56),
    anak_ke: parseIntSafe(get(57)),
    lintang,
    bujur,
    no_kk: get(60),
    berat_badan: parseIntSafe(get(61)),
    tinggi_badan: parseIntSafe(get(62)),
    lingkar_kepala: parseIntSafe(get(63)),
    jumlah_saudara: parseIntSafe(get(64)),
    jarak_rumah_km: get(65) ? parseFloat(get(65).replace(',', '.')) || null : null,
    sekolah,
    jenjang: sekolah.toLowerCase().includes('sd') ? 'SD' : 'TK',
  };
}

function extractPegawaiRecord(cols: string[], sekolah: string) {
  const nik = extractNIK(cols);
  if (!nik) return null;

  return {
    nik,
    nama: extractName(cols),
    nuptk: (cols[2] || '').trim(),
    jk: (cols[3] || '').trim(),
    tempat_lahir: (cols[4] || '').trim(),
    tanggal_lahir: (cols[5] || '').trim(),
    nip: (cols[6] || '').trim(),
    status_kepegawaian: (cols[7] || '').trim(),
    jenis_ptk: (cols[8] || '').trim(),
    agama: (cols[9] || '').trim(),
    alamat: (cols[10] || '').trim(),
    rt: (cols[11] || '').trim(),
    rw: (cols[12] || '').trim(),
    dusun: (cols[13] || '').trim(),
    desa: (cols[14] || '').trim(),
    kecamatan: (cols[15] || '').trim(),
    kode_pos: (cols[16] || '').trim(),
    telepon: (cols[17] || '').trim(),
    hp: (cols[18] || '').trim(),
    email: (cols[19] || '').trim(),
    tugas_tambahan: (cols[20] || '').trim(),
    sk_cpns: (cols[21] || '').trim(),
    tanggal_cpns: (cols[22] || '').trim(),
    sk_pengangkatan: (cols[23] || '').trim(),
    tmt_pengangkatan: (cols[24] || '').trim(),
    lembaga_pengangkatan: (cols[25] || '').trim(),
    pangkat_golongan: (cols[26] || '').trim(),
    sumber_gaji: (cols[27] || '').trim(),
    nama_ibu_kandung: (cols[28] || '').trim(),
    status_perkawinan: (cols[29] || '').trim(),
    nama_suami_istri: (cols[30] || '').trim(),
    nip_suami_istri: (cols[31] || '').trim(),
    pekerjaan_suami_istri: (cols[32] || '').trim(),
    tmt_pns: (cols[33] || '').trim(),
    lisensi_kepala_sekolah: (cols[34] || '').trim(),
    npwp: (cols[38] || '').trim(),
    nama_wajib_pajak: (cols[39] || '').trim(),
    kewarganegaraan: (cols[40] || '').trim(),
    no_kk: (cols[45] || '').trim(),
    karpeg: (cols[46] || '').trim(),
    karis_karsu: (cols[47] || '').trim(),
    sekolah,
  };
}

export function UpdateDataSiswaPegawai() {
  const { user, setCurrentView } = useAppStore();
  const [tipe, setTipe] = useState<ImportType>('siswa');
  const [csvUrl, setCsvUrl] = useState('');
  const [csvText, setCsvText] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'paste'>('url');
  const [status, setStatus] = useState<ImportStatus>('IDLE');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [sekolah, setSekolah] = useState('');

  const reset = useCallback(() => {
    setStatus('IDLE');
    setProgress(0);
    setResult(null);
  }, []);

  async function handleImport() {
    reset();

    let rawData = csvText;
    if (inputMode === 'url') {
      if (!csvUrl.trim()) return;
      setStatus('ANALISA');
      try {
        const res = await fetch(csvUrl.trim());
        if (!res.ok) throw new Error(`Gagal mengunduh CSV (HTTP ${res.status})`);
        rawData = await res.text();
      } catch (e: any) {
        setStatus('ERROR');
        setResult({ total: 0, success: 0, errors: [{ row: 0, message: e.message }], collection: '' });
        return;
      }
    }

    if (!rawData || !rawData.trim()) {
      setStatus('ERROR');
      setResult({ total: 0, success: 0, errors: [{ row: 0, message: 'Data CSV kosong' }], collection: '' });
      return;
    }

    const lines = rawData.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 5) {
      setStatus('ERROR');
      setResult({ total: 0, success: 0, errors: [{ row: 0, message: 'CSV tidak memiliki cukup baris data' }], collection: '' });
      return;
    }

    setStatus('ANALISA');
    await new Promise(r => setTimeout(r, 50));

    try {
      const schoolLine = lines[1];
      const schoolParts = parseCSVLine(schoolLine);
      let sekolahName = schoolParts[0]?.trim() || '';
      const kecIndex = sekolahName.toUpperCase().indexOf('KECAMATAN');
      if (kecIndex > 0) sekolahName = sekolahName.substring(0, kecIndex).trim();
      setSekolah(sekolahName);

      const dataStartIndex = tipe === 'siswa' ? 6 : 5;
      const dataRows = lines.slice(dataStartIndex);

      if (dataRows.length === 0) {
        setStatus('ERROR');
        setResult({ total: 0, success: 0, errors: [{ row: 0, message: 'Tidak ada data ditemukan' }], collection: '' });
        return;
      }

      setStatus('STRUKTUR');
      await new Promise(r => setTimeout(r, 50));

      const parsed: any[] = [];
      const parseErrors: { row: number; message: string }[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const cols = parseCSVLine(dataRows[i]);
        if (cols.length < 5) continue;

        const record = tipe === 'siswa'
          ? extractSiswaRecord(cols, sekolahName)
          : extractPegawaiRecord(cols, sekolahName);

        if (record) {
          parsed.push(record);
        } else {
          parseErrors.push({ row: i + 1, message: 'NIK tidak ditemukan' });
        }
      }

      if (parsed.length === 0) {
        setStatus('ERROR');
        setResult({ total: 0, success: 0, errors: parseErrors, collection: tipe === 'siswa' ? 'students' : 'employees' });
        return;
      }

      setStatus('VERIFIKASI');
      await new Promise(r => setTimeout(r, 50));

      const valid: any[] = [];
      const verifyErrors: { row: number; message: string }[] = [...parseErrors];

      for (const item of parsed) {
        if (!item.nama) {
          verifyErrors.push({ row: 0, message: `NIK ${item.nik}: Nama kosong` });
          continue;
        }
        valid.push({
          ...item,
          updatedAt: Date.now(),
          createdAt: Date.now(),
        });
      }

      setStatus('UPDATE');
      const collectionName = tipe === 'siswa' ? 'students' : 'employees';
      let success = 0;
      const updateErrors: { row: number; message: string }[] = [...verifyErrors];

      for (let i = 0; i < valid.length; i++) {
        const item = valid[i];
        try {
          await setDoc(doc(db!, collectionName, item.nik), item, { merge: true });
          success++;
        } catch (e: any) {
          updateErrors.push({ row: i + 1, message: `NIK ${item.nik}: ${e.message}` });
        }
        setProgress(Math.round(((i + 1) / valid.length) * 100));
      }

      setStatus('AUTO_SAVE');
      await new Promise(r => setTimeout(r, 50));

      const importRecord = {
        type: tipe,
        collection: collectionName,
        sekolah: sekolahName,
        totalData: valid.length + verifyErrors.length,
        imported: success,
        errors: updateErrors.length,
        userEmail: user?.email || '',
        userName: user?.displayName || '',
        createdAt: Date.now(),
      };

      try {
        await addDoc(collection(db!, 'import_history'), importRecord);
      } catch { }

      try {
        await addDoc(collection(db!, 'logs'), {
          action: 'import_data',
          detail: `${tipe === 'siswa' ? 'Siswa' : 'Pegawai'} - ${sekolahName}`,
          total: valid.length,
          imported: success,
          errors: updateErrors.length,
          uid: user?.uid || '',
          timestamp: Date.now(),
        });
      } catch { }

      setStatus('DONE');
      setResult({
        total: updateErrors.length,
        success,
        errors: updateErrors.filter(e => e.message !== 'NIK tidak ditemukan'),
        collection: collectionName,
      });

    } catch (e: any) {
      setStatus('ERROR');
      setResult({ total: 0, success: 0, errors: [{ row: 0, message: e.message }], collection: '' });
    }
  }

  const stepStatus = (step: ImportStatus): 'current' | 'done' | 'pending' | 'error' => {
    if (status === 'ERROR' && STEPS.indexOf(step) <= STEPS.indexOf(status === 'ERROR' ? 'UPDATE' : 'DONE')) {
      return STEPS.indexOf(step) < STEPS.indexOf('ANALISA') ? 'done' : 'pending';
    }
    const idx = STEPS.indexOf(step);
    const curIdx = STEPS.indexOf(status === 'DONE' ? 'AUTO_SAVE' : status);
    if (idx < curIdx || (status === 'DONE' && idx <= curIdx)) return 'done';
    if (idx === curIdx) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentView('super-dashboard')} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Update Data Siswa &amp; Pegawai</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-5">
        <div className="flex gap-4">
          <Button
            variant={tipe === 'siswa' ? 'default' : 'outline'}
            onClick={() => { setTipe('siswa'); reset(); }}
            className={tipe === 'siswa' ? 'bg-blue-800 hover:bg-blue-900' : ''}
          >
            <FileText className="w-4 h-4 mr-2" /> Siswa
          </Button>
          <Button
            variant={tipe === 'pegawai' ? 'default' : 'outline'}
            onClick={() => { setTipe('pegawai'); reset(); }}
            className={tipe === 'pegawai' ? 'bg-blue-800 hover:bg-blue-900' : ''}
          >
            <FileText className="w-4 h-4 mr-2" /> Pegawai (GTK)
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant={inputMode === 'url' ? 'default' : 'outline'} size="sm" onClick={() => setInputMode('url')}>
            URL CSV
          </Button>
          <Button variant={inputMode === 'paste' ? 'default' : 'outline'} size="sm" onClick={() => setInputMode('paste')}>
            Paste CSV
          </Button>
        </div>

        {inputMode === 'url' ? (
          <div className="space-y-2">
            <Label>URL CSV</Label>
            <div className="flex gap-2">
              <Input
                value={csvUrl}
                onChange={e => setCsvUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                className="flex-1"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Data CSV</Label>
            <Textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={`Tempel data CSV di sini...\nBaris pertama: judul\nBaris kedua: nama sekolah\n...`}
              rows={8}
            />
          </div>
        )}

        {sekolah && (
          <p className="text-sm text-muted-foreground">
            <Database className="w-3.5 h-3.5 inline mr-1" />
            Sekolah: <span className="font-medium text-foreground">{sekolah}</span>
          </p>
        )}

        <Button
          onClick={handleImport}
          disabled={status === 'ANALISA' || status === 'STRUKTUR' || status === 'VERIFIKASI' || status === 'UPDATE' || status === 'AUTO_SAVE' || (inputMode === 'url' && !csvUrl.trim()) || (inputMode === 'paste' && !csvText.trim())}
          className="bg-blue-800 hover:bg-blue-900 text-white gap-2"
        >
          {(status === 'ANALISA' || status === 'STRUKTUR' || status === 'VERIFIKASI' || status === 'UPDATE' || status === 'AUTO_SAVE')
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
            : <><Upload className="w-4 h-4" /> Import</>}
        </Button>
      </div>

      {status !== 'IDLE' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Progres Import</h2>
            {status === 'DONE' && (
              <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Selesai
              </span>
            )}
            {status === 'ERROR' && (
              <span className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Gagal
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => {
              const st = stepStatus(step);
              return (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                    st === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                    st === 'current' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse' :
                    st === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                    'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  }`}>
                    {st === 'done' ? <CheckCircle2 className="w-3 h-3" /> :
                     st === 'current' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     st === 'error' ? <XCircle className="w-3 h-3" /> :
                     null}
                    {step.replace('_', ' ')}
                  </div>
                  {idx < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />}
                </div>
              );
            })}
          </div>

          {(status === 'UPDATE' || status === 'AUTO_SAVE') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mengupdate data...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Hasil Import</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.total}</p>
                  <p className="text-xs text-muted-foreground">Total Data</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.success}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Berhasil</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{result.errors.length}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Gagal</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">{result.collection}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Koleksi</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Detail Error:</p>
                  {result.errors.slice(0, 10).map((e, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">Baris {e.row}: {e.message}</p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-xs text-red-500 mt-1">...dan {result.errors.length - 10} error lainnya</p>
                  )}
                </div>
              )}
            </div>
          )}

          {status === 'DONE' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Save className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Riwayat import dan log aktivitas telah disimpan.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
