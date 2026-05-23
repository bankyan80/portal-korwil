'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ArrowLeft, Search, Users, Download, Printer, Loader2, AlertTriangle } from 'lucide-react';
import Footer from '@/components/portal/Footer';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { rombelData } from '@/data/rombel';
import { useSekolah } from '@/hooks/useSekolah';

// ---------------------------------------------------------------------------
// CACHE
// ---------------------------------------------------------------------------
const CACHE_KEY = 'mapping-pegawai-cache-v3';
const CACHE_TTL = 15 * 60 * 1000;

function loadCache(): SchoolRow[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp }: { data: SchoolRow[]; timestamp: number } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}
function saveCache(data: SchoolRow[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
type PegawaiCategory = 'pai' | 'penjas' | 'kelas' | 'tendik';

interface CatBreakdown {
  realPtk: number;
  pns: number;
  pppk: number;
  pppkParuhWaktu: number;
  nonAsnSerdik: number;
  nonAsnMurni: number;
  nonAsnNonDapodik: number;
  jumlah: number;
  kebutuhan: number;
  kurangLebih: number;
}

interface SchoolRow {
  no: number;
  sekolahId: string;
  sekolahNama: string;
  kepalaSekolah: number;
  jumlahSiswa: number;
  jumlahRombel: number;
  pai: CatBreakdown;
  penjas: CatBreakdown;
  kelas: CatBreakdown;
  tendik: CatBreakdown;
}

// ---------------------------------------------------------------------------
// SCHOOL ORDER (21 SD Negeri Kecamatan Lemahabang)
// ---------------------------------------------------------------------------
const SEKOLAH_ORDER = [
  'SD NEGERI 1 LEMAHABANG',
  'SD NEGERI 1 SIGONG',
  'SD NEGERI 1 SARAJAYA',
  'SD NEGERI 1 LEMAHABANG KULON',
  'SD NEGERI 2 CIPEUJEUH KULON',
  'SD NEGERI 2 BELAWA',
  'SD NEGERI 1 CIPEUJEUH WETAN',
  'SD NEGERI 3 CIPEUJEUH WETAN',
  'SD NEGERI 1 CIPEUJEUH KULON',
  'SD NEGERI 2 CIPEUJEUH WETAN',
  'SD NEGERI 4 SIGONG',
  'SD NEGERI 1 TUK KARANGSUWUNG',
  'SD NEGERI 1 ASEM',
  'SD NEGERI 1 LEUWIDINGDING',
  'SD NEGERI 1 BELAWA',
  'SD NEGERI 2 SARAJAYA',
  'SD NEGERI 3 SIGONG',
  'SD NEGERI 1 WANGKELANG',
  'SD NEGERI 1 PICUNGPUGUR',
  'SD NEGERI 1 SINDANGLAUT',
  'SD NEGERI 2 LEMAHABANG',
];

function orderSchools(allSchools: { nama: string; npsn?: string }[]): { nama: string; npsn?: string }[] {
  const map = new Map(allSchools.map(s => [s.nama, s]));
  const ordered: { nama: string; npsn?: string }[] = [];
  for (const name of SEKOLAH_ORDER) {
    const found = map.get(name);
    if (found) ordered.push(found);
  }
  for (const s of allSchools) {
    if (!ordered.find(o => o.nama === s.nama)) ordered.push(s);
  }
  return ordered;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function buildBreakdown(): CatBreakdown {
  return {
    realPtk: 0, pns: 0, pppk: 0, pppkParuhWaktu: 0,
    nonAsnSerdik: 0, nonAsnMurni: 0, nonAsnNonDapodik: 0,
    jumlah: 0, kebutuhan: 0, kurangLebih: 0,
  };
}

function categorisePegawai(p: Record<string, any>): PegawaiCategory | null {
  const jenisPtk = (p.jenis_ptk || '').toLowerCase();
  const jabatan = (p.jabatan || '').toLowerCase();
  const mapel = (p.mapel || '').toLowerCase();
  const sertifikasi = (p.sertifikasi || '').toLowerCase();
  const kategoriGuru = (p.kategoriGuru || p.kategori_guru || '').toLowerCase();

  // Tenaga Kependidikan
  if (
    kategoriGuru.includes('tenaga kependidikan') ||
    kategoriGuru.includes('tendik') ||
    jenisPtk.includes('tendik') ||
    jenisPtk.includes('tenaga kependidikan') ||
    jabatan.includes('tenaga kependidikan') ||
    jabatan.includes('tendik')
  ) {
    return 'tendik';
  }

  // Kepala Sekolah -> tidak masuk kategori apapun, hanya dihitung di kolom kepala sekolah
  if (
    jenisPtk.includes('kepala sekolah') ||
    jabatan.includes('kepala sekolah')
  ) {
    return null;
  }

  // Guru PAI detection (check ALL fields: kategori, mapel, sertifikasi, jabatan, jenis_ptk)
  const paiKeywords = ['pai', 'pendidikan agama', 'pendidikan agama islam', 'pend. agama', 'guru pai', 'pendidikan agama islam dan bhs arab', 'pai dan bhs arab', 'pendidikan agama islam dan bahasa arab'];
  const isPAI = paiKeywords.some(kw =>
    kategoriGuru.includes(kw) ||
    mapel.includes(kw) ||
    sertifikasi.includes(kw) ||
    jabatan.includes(kw) ||
    jenisPtk.includes(kw)
  );
  if (isPAI) return 'pai';

  // Also check for "agama" keyword in mapel/jabatan (but not "pendidikan agama" which is already caught)
  if (
    mapel.includes('agama') ||
    jabatan.includes('agama')
  ) {
    return 'pai';
  }

  // Guru Penjaskes detection
  if (
    mapel.includes('penjas') ||
    mapel.includes('pjok') ||
    mapel.includes('pendidikan jasmani') ||
    mapel.includes('olahraga') ||
    sertifikasi.includes('penjas') ||
    sertifikasi.includes('penjaskes') ||
    sertifikasi.includes('pjok') ||
    sertifikasi.includes('olahraga') ||
    kategoriGuru.includes('penjas') ||
    kategoriGuru.includes('pjok') ||
    kategoriGuru.includes('olahraga') ||
    jabatan.includes('penjas') ||
    jabatan.includes('pjok') ||
    jabatan.includes('pendidikan jasmani') ||
    jabatan.includes('olahraga')
  ) {
    return 'penjas';
  }

  // Check explicit kategori for guru kelas
  if (kategoriGuru.includes('guru kelas')) return 'kelas';

  // Default: Guru Kelas (if jenis_ptk indicates Guru)
  if (jenisPtk.includes('guru')) {
    return 'kelas';
  }

  return null;
}

function toStatusKepegawaian(p: Record<string, any>): string {
  const raw = (p.status_kepegawaian || p.statusKepegawaian || '').toLowerCase().trim();
  if (!raw) return '';
  if (raw.includes('pns')) return 'pns';
  if (raw.includes('pppk') && (raw.includes('paruh') || raw.includes('waktu'))) return 'pppkParuhWaktu';
  if (raw.includes('pppk')) return 'pppk';
  if (raw.includes('gty') || raw.includes('pty')) return 'nonAsn';
  if (raw.includes('non asn') || raw.includes('honorer') || raw.includes('honor')) return 'nonAsn';
  return '';
}

function getSertifikasiStatus(p: Record<string, any>): string {
  const s = (p.sertifikasi || '').toLowerCase().trim();
  if (s.includes('serdik')) return 'serdik';
  return 'non-serdik';
}

function isDapodik(p: Record<string, any>): boolean {
  const d = (p.dapodik ?? p.Dapodik ?? '').toString().toLowerCase();
  if (d === 'false' || d === '0' || d === 'no' || d === 'tidak') return false;
  if (d === 'true' || d === '1' || d === 'yes' || d === 'ya') return true;
  // If field exists and has any truthy value, consider dapodik
  if (p.dapodik !== undefined && p.dapodik !== null && p.dapodik !== '') return true;
  // Default: assume dapodik if no explicit non-dapodik marker
  return true;
}

function isActivePegawai(p: Record<string, any>): boolean {
  const aktif = p.aktif ?? p.aktifStatus ?? p.statusAktif;
  if (aktif === false || aktif === 'false' || aktif === '0' || aktif === 'nonaktif' || aktif === 'tidak') return false;
  const statusKepegawaian = (p.status_kepegawaian || p.statusKepegawaian || '').trim();
  if (!statusKepegawaian) return false;
  return true;
}

function determineStatusBucket(p: Record<string, any>): string[] {
  const status = toStatusKepegawaian(p);
  const buckets: string[] = [];

  if (status === 'pns') {
    buckets.push('pns');
  } else if (status === 'pppk') {
    buckets.push('pppk');
  } else if (status === 'pppkParuhWaktu') {
    buckets.push('pppkParuhWaktu');
  } else if (status === 'nonAsn') {
    const sertifikasi = getSertifikasiStatus(p);
    const dapodik = isDapodik(p);

    if (sertifikasi === 'serdik') {
      buckets.push('nonAsnSerdik');
    }

    // Non ASN Murni = Non ASN + Non Serdik + Dapodik
    if (sertifikasi !== 'serdik' && dapodik) {
      buckets.push('nonAsnMurni');
    }

    // Non ASN Non Dapodik = Non ASN + Non Dapodik
    if (!dapodik) {
      buckets.push('nonAsnNonDapodik');
    }
  }

  return buckets;
}

function fmtNum(n: number): string {
  if (n === undefined || n === null || isNaN(n)) return '0';
  return String(n);
}

function fmtKL(v: number): string {
  if (!v || isNaN(v)) return '0';
  if (v > 0) return `+${v}`;
  if (v < 0) return `${v}`;
  return '0';
}

function klColor(v: number): string {
  if (v < 0) return 'text-red-600 font-semibold';
  if (v > 0) return 'text-emerald-600 font-semibold';
  return 'text-gray-600';
}

// ---------------------------------------------------------------------------
// AGGREGATE
// ---------------------------------------------------------------------------
function aggregate(
  pegawaiList: Record<string, any>[],
  schoolList: { nama: string; npsn?: string }[],
  siswaList: Record<string, any>[],
): SchoolRow[] {
  const rows: SchoolRow[] = [];

  for (const s of schoolList) {
    const sName = s.nama;
    const sp = pegawaiList.filter(p => {
      const sekolahName = (p.sekolah || p.namaSekolah || p.schoolName || '').trim();
      return sekolahName === sName || sekolahName.toUpperCase() === sName.toUpperCase();
    });

    // Dedup pegawai by name to avoid double-counting same person
    // Handles cases like "SUKIRAH, S.Pd.SD" vs "Sukirah" (same person, different NIK)
    // Also merges fields: prefers records with kategoriGuru/mapel set (from Google Sheets)
    const normalizeName = (n: string) => n.replace(/[.,\s]+/g, '').toUpperCase().trim();
    const hasCategoryInfo = (p: Record<string, any>) => {
      const kg = (p.kategoriGuru || p.kategori_guru || '').trim();
      const mp = (p.mapel || '').trim();
      return !!(kg || mp);
    };
    const seen = new Map<string, Record<string, any>>();
    for (const p of sp) {
      const namaNorm = normalizeName(p.nama || '');
      if (!namaNorm) {
        seen.set(`_anon_${Math.random()}`, p);
        continue;
      }

      // Check if this name is a substring match with existing
      let matchedKey: string | null = null;
      for (const [key] of seen) {
        if (key.startsWith('_anon_')) continue;
        if (key.includes(namaNorm) || namaNorm.includes(key)) {
          matchedKey = key;
          break;
        }
      }

      if (!matchedKey) {
        seen.set(namaNorm, p);
      } else {
        const existing = seen.get(matchedKey)!;
        const existingHasCat = hasCategoryInfo(existing);
        const currentHasCat = hasCategoryInfo(p);

        // Always prefer record with category info (from Google Sheets)
        if (currentHasCat && !existingHasCat) {
          seen.set(matchedKey, p);
        } else if (!currentHasCat && existingHasCat) {
          // Keep existing (has category)
        } else {
          // Both have or both don't have category info, use NIK preference
          const existingNik = (existing.nik || '').trim();
          const currentNik = (p.nik || '').trim();
          if (existingNik.length === 16 && currentNik.length !== 16) {
            // Keep existing
          } else if (currentNik.length === 16 && existingNik.length !== 16) {
            seen.set(matchedKey, p);
          } else if (!existingNik && currentNik) {
            seen.set(matchedKey, p);
          }
        }
      }
    }
    const uniqueSp = Array.from(seen.values());

    const pai = buildBreakdown();
    const penjas = buildBreakdown();
    const kelas = buildBreakdown();
    const tendik = buildBreakdown();

    for (const p of uniqueSp) {
      if (!isActivePegawai(p)) continue;
      const kategori = categorisePegawai(p);
      if (!kategori) continue;

      const buckets = determineStatusBucket(p);

      const cat = kategori === 'pai' ? pai : kategori === 'penjas' ? penjas : kategori === 'kelas' ? kelas : tendik;
      cat.realPtk += 1;

      for (const bucket of buckets) {
        if (bucket === 'pns') cat.pns += 1;
        else if (bucket === 'pppk') cat.pppk += 1;
        else if (bucket === 'pppkParuhWaktu') cat.pppkParuhWaktu += 1;
        else if (bucket === 'nonAsnSerdik') cat.nonAsnSerdik += 1;
        else if (bucket === 'nonAsnMurni') cat.nonAsnMurni += 1;
        else if (bucket === 'nonAsnNonDapodik') cat.nonAsnNonDapodik += 1;
      }
    }

    // jumlah = realPtk (total guru aktif di kategori ini)
    for (const cat of [pai, penjas, kelas, tendik]) {
      cat.jumlah = cat.realPtk;
    }

    // Rombel & Siswa from Firebase students, fallback to static rombelData
    const siswaSchool = siswaList.filter(s => {
      const sName = (s.sekolah || s.schoolName || '').trim();
      return sName === sName || sName.toUpperCase() === sName.toUpperCase();
    });
    const siswaBySchool = siswaSchool.filter(s => {
      const sName = (s.sekolah || s.schoolName || '').trim();
      return sName.toUpperCase() === sName.toUpperCase() || s.schoolId === (s.npsn || '');
    });
    const firebaseSiswaCount = siswaBySchool.length;
    const firebaseRombels = new Set(siswaBySchool.map(s => s.kelas).filter(Boolean));
    const firebaseRombelCount = firebaseRombels.size;

    const rm = rombelData.find(r => r.name.toUpperCase() === sName.toUpperCase());
    const jumlahRombel = firebaseRombelCount > 0 ? firebaseRombelCount : (rm ? rm.rombels : 0);
    const jumlahSiswa = firebaseSiswaCount > 0 ? firebaseSiswaCount : (rm ? rm.total : 0);

    // Kepala Sekolah count (jumlah pegawai dengan jabatan Kepala Sekolah, sudah dedup)
    const ksList = uniqueSp.filter(p => {
      if (!isActivePegawai(p)) return false;
      const jenisPtk = (p.jenis_ptk || '').toLowerCase();
      const jabatan = (p.jabatan || '').toLowerCase();
      return jenisPtk.includes('kepala sekolah') || jabatan.includes('kepala sekolah');
    });
    const kepalaSekolahCount = ksList.length;

    // Kebutuhan ideal
    const kebutuhanPai = 1;
    const kebutuhanPenjas = 1;
    const kebutuhanKelas = jumlahRombel;
    const kebutuhanTendik = 2;

    pai.kebutuhan = kebutuhanPai;
    penjas.kebutuhan = kebutuhanPenjas;
    kelas.kebutuhan = kebutuhanKelas;
    tendik.kebutuhan = kebutuhanTendik;

    pai.kurangLebih = pai.jumlah - pai.kebutuhan;
    penjas.kurangLebih = penjas.jumlah - penjas.kebutuhan;
    kelas.kurangLebih = kelas.jumlah - kelas.kebutuhan;
    tendik.kurangLebih = tendik.jumlah - tendik.kebutuhan;

    rows.push({
      no: 0,
      sekolahId: s.npsn || sName,
      sekolahNama: sName,
      kepalaSekolah: kepalaSekolahCount,
      jumlahSiswa,
      jumlahRombel,
      pai, penjas, kelas, tendik,
    });
  }

  rows.forEach((r, i) => { r.no = i + 1; });
  return rows;
}

function computeTotals(rows: SchoolRow[]): SchoolRow {
  const sumCat = (field: keyof CatBreakdown, cat: 'pai' | 'penjas' | 'kelas' | 'tendik') =>
    rows.reduce((a, r) => a + (r[cat][field] || 0), 0);

  const siswaTot = rows.reduce((a, r) => a + (r.jumlahSiswa || 0), 0);
  const rombelTot = rows.reduce((a, r) => a + (r.jumlahRombel || 0), 0);

  const makeTotal = (cat: 'pai' | 'penjas' | 'kelas' | 'tendik'): CatBreakdown => {
    const realPtk = sumCat('realPtk', cat);
    const pns = sumCat('pns', cat);
    const pppk = sumCat('pppk', cat);
    const pppkParuhWaktu = sumCat('pppkParuhWaktu', cat);
    const nonAsnSerdik = sumCat('nonAsnSerdik', cat);
    const nonAsnMurni = sumCat('nonAsnMurni', cat);
    const nonAsnNonDapodik = sumCat('nonAsnNonDapodik', cat);
    const jumlah = realPtk;
    const kebutuhan = sumCat('kebutuhan', cat);
    const kurangLebih = jumlah - kebutuhan;
    return { realPtk, pns, pppk, pppkParuhWaktu, nonAsnSerdik, nonAsnMurni, nonAsnNonDapodik, jumlah, kebutuhan, kurangLebih };
  };

  return {
    no: 0,
    sekolahId: '',
    sekolahNama: 'TOTAL PEGAWAI',
    kepalaSekolah: rows.reduce((a, r) => a + (r.kepalaSekolah || 0), 0),
    jumlahSiswa: siswaTot,
    jumlahRombel: rombelTot,
    pai: makeTotal('pai'),
    penjas: makeTotal('penjas'),
    kelas: makeTotal('kelas'),
    tendik: makeTotal('tendik'),
  };
}

// ---------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------
export default function MappingPegawaiPage() {
  const { schools } = useSekolah();
  const [rows, setRows] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Memuat data pegawai...');
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'cache' | 'error'>('connected');
  const [search, setSearch] = useState('');

  const tableRef = useRef<HTMLTableElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ---------- DATA FETCH (REALTIME) ----------
  useEffect(() => {
    if (!db) {
      const cached = loadCache();
      if (cached) { setRows(cached); setFirebaseStatus('cache'); }
      setLoading(false);
      return;
    }

    setLoading(true);
    const cachedRows = loadCache();
    if (cachedRows) { setRows(cachedRows); setFirebaseStatus('cache'); }

    function processData(employees: Record<string, any>[], students: Record<string, any>[]) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const sekolahListRaw = schools.filter(s => s.jenjang === 'SD' && s.status === 'NEGERI').map(s => ({ nama: s.nama, npsn: s.npsn }));
        const sekolahList = orderSchools(sekolahListRaw);
        const aggregated = aggregate(employees, sekolahList, students);
        setRows(aggregated);
        setFirebaseStatus('connected');
        setLoading(false);
        saveCache(aggregated);
      }, 500);
    }

    let latestEmployees: Record<string, any>[] = [];
    let latestStudents: Record<string, any>[] = [];
    let empReady = false;
    let stuReady = false;

    getDocs(query(collection(db, 'employees'))).then(
      (snap) => {
        latestEmployees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        empReady = true;
        if (stuReady) processData(latestEmployees, latestStudents);
      },
      () => { setFirebaseStatus('error'); setLoading(false); }
    );

    getDocs(query(collection(db, 'students'))).then(
      (snap) => {
        latestStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        stuReady = true;
        if (empReady) processData(latestEmployees, latestStudents);
      },
      () => { setFirebaseStatus('error'); setLoading(false); }
    );

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ---------- SEARCH ----------
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => r.sekolahNama.toLowerCase().includes(q));
  }, [rows, search]);

  // ---------- TOTALS ----------
  const totals = useMemo((): SchoolRow => {
    return computeTotals(rows);
  }, [rows]);

  // ---------- PRINT ----------
  const handlePrint = useCallback(() => { window.print(); }, []);

  // ---------- EXPORT EXCEL ----------
  const exportExcel = useCallback(() => {
    const headers = [
      'NO', 'SATUAN KERJA', 'KEPALA SEKOLAH', 'JUMLAH SISWA', 'JUMLAH ROMBEL',
      'GURU PAI – REAL PTK', 'PAI – PNS', 'PAI – PPPK', 'PAI – PPPK PARUH WAKTU',
      'PAI – NON ASN SERDIK', 'PAI – NON ASN MURNI', 'PAI – NON ASN NON DAPODIK',
      'JUMLAH GURU PAI', 'KURANG / LEBIH GURU PAI',
      'GURU PENJAS – REAL PTK', 'PENJAS – PNS', 'PENJAS – PPPK', 'PENJAS – PPPK PARUH WAKTU',
      'PENJAS – NON ASN SERDIK', 'PENJAS – NON ASN MURNI', 'PENJAS – NON ASN NON DAPODIK',
      'JUMLAH GURU PENJAS', 'KURANG / LEBIH GURU PENJAS',
      'GURU KELAS – REAL PTK', 'KELAS – PNS', 'KELAS – PPPK', 'KELAS – PPPK PARUH WAKTU',
      'KELAS – NON ASN SERDIK', 'KELAS – NON ASN MURNI', 'KELAS – NON ASN NON DAPODIK',
      'JUMLAH GURU KELAS', 'KURANG / LEBIH GURU KELAS',
      'TENDIK – REAL PTK', 'TENDIK – PNS', 'TENDIK – PPPK', 'TENDIK – PPPK PARUH WAKTU',
      'TENDIK – NON ASN MURNI', 'TENDIK – NON ASN NON DAPODIK',
      'JUMLAH TENDIK', 'KURANG / LEBIH TENDIK',
    ];

    const BOM = '\uFEFF';
    const dataRows = [...filteredRows, totals];
    const rowsCSV = [headers.join('\t')];

    for (const r of dataRows) {
      const row = [
        r.no ? String(r.no) : 'TOTAL',
        r.sekolahNama,
        String(r.kepalaSekolah),
        String(r.jumlahSiswa),
        String(r.jumlahRombel),
        String(r.pai.realPtk),       String(r.pai.pns),       String(r.pai.pppk),       String(r.pai.pppkParuhWaktu),       String(r.pai.nonAsnSerdik),       String(r.pai.nonAsnMurni),       String(r.pai.nonAsnNonDapodik),       String(r.pai.jumlah),       fmtKL(r.pai.kurangLebih),
        String(r.penjas.realPtk),    String(r.penjas.pns),    String(r.penjas.pppk),    String(r.penjas.pppkParuhWaktu),    String(r.penjas.nonAsnSerdik),    String(r.penjas.nonAsnMurni),    String(r.penjas.nonAsnNonDapodik),    String(r.penjas.jumlah),    fmtKL(r.penjas.kurangLebih),
        String(r.kelas.realPtk),     String(r.kelas.pns),     String(r.kelas.pppk),     String(r.kelas.pppkParuhWaktu),     String(r.kelas.nonAsnSerdik),     String(r.kelas.nonAsnMurni),     String(r.kelas.nonAsnNonDapodik),     String(r.kelas.jumlah),     fmtKL(r.kelas.kurangLebih),
        String(r.tendik.realPtk),    String(r.tendik.pns),    String(r.tendik.pppk),    String(r.tendik.pppkParuhWaktu),    String(r.tendik.nonAsnMurni),    String(r.tendik.nonAsnNonDapodik),    String(r.tendik.jumlah),    fmtKL(r.tendik.kurangLebih),
      ];
      rowsCSV.push(row.join('\t'));
    }

    const blob = new Blob([BOM + rowsCSV.join('\n')], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mapping-pegawai.tsv'; a.click();
    URL.revokeObjectURL(url);
  }, [filteredRows, totals]);

  const exportPdf = useCallback(() => { handlePrint(); }, [handlePrint]);

  // ---------- RENDER HELPERS ----------
  const renderBreakdownCells = (cat: CatBreakdown) => (
    <>
      <td className="px-1.5 py-1 border text-center text-[10.5px]">{fmtNum(cat.realPtk)}</td>
      <td className="px-1.5 py-1 border text-center text-[10.5px]">{fmtNum(cat.pns)}</td>
      <td className="px-1.5 py-1 border text-center text-[10.5px]">{fmtNum(cat.pppk)}</td>
      <td className="px-1.5 py-1 border text-center text-[10.5px]">{fmtNum(cat.pppkParuhWaktu)}</td>
      <td className="px-1.5 py-1 border text-center text-[10.5px]">{fmtNum(cat.nonAsnSerdik)}</td>
      <td className="px-1.5 py-1 border text-center text-[10.5px]">{fmtNum(cat.nonAsnMurni)}</td>
      <td className="px-1.5 py-1 border text-center text-[10.5px]">{fmtNum(cat.nonAsnNonDapodik)}</td>
      <td className="px-1.5 py-1 border text-center text-[10.5px] font-semibold text-[#0d3b66]">{fmtNum(cat.jumlah)}</td>
      <td className={`px-1.5 py-1 border text-center text-[10.5px] ${klColor(cat.kurangLebih)}`}>{fmtKL(cat.kurangLebih)}</td>
    </>
  );

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 print:!bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .overflow-x-auto { overflow: visible !important; }
          table { font-size: 8px !important; }
          th, td { padding: 2px 3px !important; }
          @page { size: landscape; margin: 10mm; }
        }
      `}</style>

      {/* Header bar */}
      <header className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66] no-print">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Kembali</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-yellow-400" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wide">Mapping Pegawai</h1>
          </div>
          <div className="flex items-center gap-2 no-print flex-wrap">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white/15 hover:bg-white/25 text-white transition-colors">
              <Printer className="w-3.5 h-3.5" /> Cetak
            </button>
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors">
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
            <button onClick={exportPdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-2 sm:px-4 py-4 space-y-3">
        {/* Title */}
        <div className="text-center py-2 no-print">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0d3b66] tracking-wide">
            PEMETAAN JENJANG SD NEGERI
          </h2>
          <h3 className="text-base sm:text-lg font-bold text-[#0d3b66] tracking-wide mt-1">
            WILAYAH KECAMATAN LEMAHABANG
          </h3>
        </div>

        {/* Toolbar */}
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 px-2 sm:px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama sekolah..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-56"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Status Firebase:</span>
            {firebaseStatus === 'connected' && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Tersambung
              </span>
            )}
            {firebaseStatus === 'cache' && (
              <span className="inline-flex items-center gap-1.5 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Cache Lokal
              </span>
            )}
            {firebaseStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-red-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Tidak Tersambung
              </span>
            )}
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-blue-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                {loadingMsg}
              </span>
            )}
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-sm text-gray-500">Memuat data...</span>
          </div>
        ) : firebaseStatus === 'error' && rows.length === 0 ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-6 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-700">Firebase Tidak Tersambung</p>
              <p className="text-red-600 mt-0.5">Tidak dapat memuat data dari server. Periksa koneksi internet atau hubungi administrator.</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse" ref={tableRef}>
                <thead className="bg-gray-100 text-gray-700 uppercase font-semibold">
                  <tr>
                    <th rowSpan={2} className="px-2 py-2 border text-center min-w-[40px] sticky left-0 z-20 bg-gray-100">NO</th>
                    <th rowSpan={2} className="px-2 py-2 border text-center min-w-[220px] sticky left-[40px] z-20 bg-gray-100">SATUAN KERJA</th>
                    <th rowSpan={2} className="px-2 py-2 border text-center min-w-[160px]">KEPALA SEKOLAH</th>
                    <th rowSpan={2} className="px-2 py-2 border text-center min-w-[70px]">JUMLAH SISWA</th>
                    <th rowSpan={2} className="px-2 py-2 border text-center min-w-[70px]">JUMLAH ROMBEL</th>

                    <th colSpan={9} className="px-2 py-2 border text-center border-l-2 border-blue-300 bg-blue-50/60">JUMLAH GURU PAI</th>
                    <th colSpan={9} className="px-2 py-2 border text-center border-l-2 border-purple-300 bg-purple-50/60">JUMLAH GURU PENJASKES</th>
                    <th colSpan={9} className="px-2 py-2 border text-center border-l-2 border-emerald-300 bg-emerald-50/60">JUMLAH GURU KELAS</th>
                    <th colSpan={8} className="px-2 py-2 border text-center border-l-2 border-orange-300 bg-orange-50/60">JUMLAH TENAGA KEPENDIDIKAN</th>
                  </tr>
                  <tr>
                    {/* Guru PAI */}
                    <th className="px-1.5 py-1.5 border text-center">REAL PTK</th>
                    <th className="px-1.5 py-1.5 border text-center">PNS</th>
                    <th className="px-1.5 py-1.5 border text-center">PPPK</th>
                    <th className="px-1.5 py-1.5 border text-center">PPPK PARUH WAKTU</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN SERDIK</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN MURNI</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN NON DAPODIK</th>
                    <th className="px-1.5 py-1.5 border text-center font-bold">JUMLAH GURU PAI</th>
                    <th className="px-1.5 py-1.5 border text-center font-bold">KURANG / LEBIH</th>

                    {/* Guru Penjas */}
                    <th className="px-1.5 py-1.5 border text-center">REAL PTK</th>
                    <th className="px-1.5 py-1.5 border text-center">PNS</th>
                    <th className="px-1.5 py-1.5 border text-center">PPPK</th>
                    <th className="px-1.5 py-1.5 border text-center">PPPK PARUH WAKTU</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN SERDIK</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN MURNI</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN NON DAPODIK</th>
                    <th className="px-1.5 py-1.5 border text-center font-bold">JUMLAH GURU PENJAS</th>
                    <th className="px-1.5 py-1.5 border text-center font-bold">KURANG / LEBIH</th>

                    {/* Guru Kelas */}
                    <th className="px-1.5 py-1.5 border text-center">REAL PTK</th>
                    <th className="px-1.5 py-1.5 border text-center">PNS</th>
                    <th className="px-1.5 py-1.5 border text-center">PPPK</th>
                    <th className="px-1.5 py-1.5 border text-center">PPPK PARUH WAKTU</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN SERDIK</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN MURNI</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN NON DAPODIK</th>
                    <th className="px-1.5 py-1.5 border text-center font-bold">JUMLAH GURU KELAS</th>
                    <th className="px-1.5 py-1.5 border text-center font-bold">KURANG / LEBIH</th>

                    {/* Tendik */}
                    <th className="px-1.5 py-1.5 border text-center">REAL PTK</th>
                    <th className="px-1.5 py-1.5 border text-center">PNS</th>
                    <th className="px-1.5 py-1.5 border text-center">PPPK</th>
                    <th className="px-1.5 py-1.5 border text-center">PPPK PARUH WAKTU</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN MURNI</th>
                    <th className="px-1.5 py-1.5 border text-center">NON ASN NON DAPODIK</th>
                    <th className="px-1.5 py-1.5 border text-center font-bold">JUMLAH TENDIK</th>
                    <th className="px-1.5 py-1.5 border text-center font-bold">KURANG / LEBIH</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, i) => {
                    const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
                    return (
                      <tr key={r.sekolahNama + r.no} className={`${rowBg} hover:bg-blue-50/40 transition-colors`}>
                        <td className="px-2 py-1.5 border text-center text-gray-500 font-medium sticky left-0 z-10 bg-inherit">{r.no}</td>
                        <td className="px-2 py-1.5 border text-left text-[#0d3b66] font-medium text-[10.5px] sticky left-[40px] z-10 bg-inherit">{r.sekolahNama}</td>
                        <td className="px-2 py-1.5 border text-center text-[10.5px]">{r.kepalaSekolah}</td>
                        <td className="px-2 py-1.5 border text-center text-[10.5px]">{r.jumlahSiswa}</td>
                        <td className="px-2 py-1.5 border text-center text-[10.5px]">{r.jumlahRombel}</td>
                        {renderBreakdownCells(r.pai)}
                        {renderBreakdownCells(r.penjas)}
                        {renderBreakdownCells(r.kelas)}
                        {renderBreakdownCells(r.tendik)}
                      </tr>
                    );
                  })}

                  {/* TOTAL ROW */}
                  <tr className="bg-blue-50/70 font-semibold border-t-2 border-blue-200">
                    <td className="px-2 py-1.5 border text-center text-gray-500 font-medium sticky left-0 z-10 bg-blue-50/70"></td>
                    <td className="px-2 py-1.5 border text-left text-[#0d3b66] font-bold text-[10.5px] sticky left-[40px] z-10 bg-blue-50/70">{totals.sekolahNama}</td>
                    <td className="px-2 py-1.5 border text-center text-[10.5px] font-semibold">{totals.kepalaSekolah}</td>
                    <td className="px-2 py-1.5 border text-center text-[10.5px] font-semibold">{totals.jumlahSiswa}</td>
                    <td className="px-2 py-1.5 border text-center text-[10.5px] font-semibold">{totals.jumlahRombel}</td>
                    {renderBreakdownCells(totals.pai)}
                    {renderBreakdownCells(totals.penjas)}
                    {renderBreakdownCells(totals.kelas)}
                    {renderBreakdownCells(totals.tendik)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-gray-600 no-print">
          <p className="font-semibold text-[#0d3b66] mb-1">Informasi</p>
          <p>
            Data ini merupakan pemetaan pendidik dan tenaga kependidikan SD Negeri Kecamatan Lemahabang.
            Data diambil dari sistem internal dan Dapodik. Jika ada kekeliruan data, silakan hubungi Admin.
            Kebutuhan ideal: Guru PAI 1 orang, Guru Penjaskes 1 orang, Tenaga Kependidikan maksimal 2 orang per sekolah.
            Kebutuhan Guru Kelas mengikuti jumlah rombel.
            Kepala Sekolah tidak termasuk dalam kategori Tenaga Kependidikan.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
