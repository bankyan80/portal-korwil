'use client';

import { useEffect, useState, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { normalizeSchool } from '@/lib/normalize';
import Link from 'next/link';
import { ArrowLeft, Printer, Loader2, Send, CheckCircle, Clock, AlertCircle, Eye, TriangleAlert } from 'lucide-react';

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const statusList = [
  { value: 'belum_lapor', label: 'Belum Lapor', icon: Clock, warn: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'sudah_dikirim', label: 'Sudah Dikirim', icon: CheckCircle, warn: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'perlu_revisi', label: 'Perlu Revisi', icon: AlertCircle, warn: 'text-red-600 bg-red-50 border-red-200' },
];

export default function LaporBulananPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sekolah, setSekolah] = useState<any>(null);
  const [bulan, setBulan] = useState(bulanList[new Date().getMonth()]);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [perKelas, setPerKelas] = useState<Record<string, { l: number; p: number }>>({});
  const [siswaL, setSiswaL] = useState(0);
  const [siswaP, setSiswaP] = useState(0);
  const [guru, setGuru] = useState({ l: 0, p: 0, total: 0 });
  const [tendik, setTendik] = useState({ l: 0, p: 0, total: 0 });
  const [dataLoading, setDataLoading] = useState(false);
  const [laporanData, setLaporanData] = useState<any>(null);
  const [sarpras, setSarpras] = useState<any>(null);
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMsg, setSubmitMsg] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [absen, setAbsen] = useState({ sakit: 0, izin: 0, tanpa_keterangan: 0 });
  const [warnings, setWarnings] = useState<{ page: string; label: string; href: string; message: string }[]>([]);

  const sarprasRoomMap: Record<string, string> = {
    'Ruang Kelas': 'ruang_kelas', 'Perpustakaan': 'perpustakaan', 'UKS': 'uks',
    'WC/Toilet': 'toilet', 'Mushola': 'mushola', 'Gudang': 'gudang', 'Ruang Guru': 'ruang_guru',
    'Ruang Kepala Sekolah': 'ruang_kepala_sekolah', 'Rumah Dinas Kepala Sekolah': 'rumah_dinas_kepsek',
  };

  function getSarprasCount(roomName: string): string {
    const key = sarprasRoomMap[roomName];
    if (!key) return '-';
    const val = sarpras?.[key];
    if (val !== undefined && val !== '' && val !== null) return String(val);
    const lval = laporanData?.dataSarpras?.[key];
    return lval !== undefined && lval !== '' && lval !== null ? String(lval) : '-';
  }

  function getSarprasVal(key: string): string {
    const val = sarpras?.[key];
    if (val !== undefined && val !== '' && val !== null) return String(val);
    const lval = laporanData?.dataSarpras?.[key];
    return lval !== undefined && lval !== '' && lval !== null ? String(lval) : '-';
  }

  function getSiswaVal(key: string): number {
    const val = laporanData?.dataSiswa?.[key];
    return val !== undefined && val !== '' ? Number(val) : NaN;
  }

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'operator_sekolah') { router.push('/login'); return; }
    loadData();
  }, [user, router]);

  useEffect(() => {
    if (dataLoading || loading || !sekolah) return;
    const w: typeof warnings = [];

    if (!sekolah?.npsn || sekolah.npsn === '-') {
      w.push({ page: 'profil-sekolah', label: 'Profil Sekolah', href: '/admin/operator/profil-sekolah', message: 'Data profil sekolah (NPSN, NSS, alamat) belum lengkap. Identitas sekolah di cetakan akan kosong.' });
    }

    const sarprasKeys = ['ruang_kelas','perpustakaan','uks','toilet','mushola','gudang','ruang_guru','tanah_pemerintah','tanah_yayasan','tanah_perseorangan','bangku','meja_murid','kursi_murid','kursi_guru','meja_guru','lemari','papan_tulis','kursi_tamu','rak_buku','sumber_air'];
    const semuaSarprasKosong = !sarpras || sarprasKeys.every(k => !sarpras[k] || sarpras[k] === '');
    if (semuaSarprasKosong) {
      w.push({ page: 'sarpras', label: 'Sarpras', href: '/admin/operator/sarpras', message: 'Data sarana & prasarana belum diisi. Tanah, ruangan, & perkakas di cetakan akan kosong.' });
    }

    if (siswaL + siswaP === 0 && !existingDocId) {
      w.push({ page: 'data-siswa', label: 'Data Siswa', href: '/admin/operator/data-siswa', message: 'Belum ada data siswa. Jumlah siswa per-kelas di cetakan akan 0.' });
    }

    if (guru.total + tendik.total === 0 && !existingDocId) {
      w.push({ page: 'data-guru', label: 'Data Guru & GTK', href: '/admin/operator/data-guru', message: 'Belum ada data GTK. Jumlah guru & tendik di cetakan akan 0.' });
    }

    setWarnings(w);
  }, [dataLoading, loading, sekolah, sarpras, laporanData, existingDocId, siswaL, siswaP, guru, tendik]);

  async function loadLaporanFromFirestore(schoolData: any) {
    if (!db) { setLaporanData(null); return; }
    try {
      const blnIndex = String(bulanList.indexOf(bulan) + 1).padStart(2, '0');
      const schoolId = user?.schoolId || normalizeSchool(user?.schoolName || '').replace(/\s+/g, '-');
      const docRef = doc(db, 'laporanBulanan', tahun, blnIndex, schoolId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setLaporanData({ id: snap.id, ...snap.data() });
        setExistingDocId(snap.id);
      } else {
        setLaporanData(null);
        setExistingDocId(null);
      }
      if (snap.exists()) {
        setLaporanData({ id: snap.id, ...snap.data() });
        setExistingDocId(snap.id);
        const d = snap.data();
        if (d.dataAbsen) {
          setAbsen({
            sakit: Number(d.dataAbsen.sakit) || 0,
            izin: Number(d.dataAbsen.izin) || 0,
            tanpa_keterangan: Number(d.dataAbsen.tanpa_keterangan) || 0,
          });
        } else {
          setAbsen({ sakit: 0, izin: 0, tanpa_keterangan: 0 });
        }
      } else {
        setLaporanData(null);
        setExistingDocId(null);
        setAbsen({ sakit: 0, izin: 0, tanpa_keterangan: 0 });
      }
    } catch (e) { console.error('Gagal memuat laporan:', e); setLaporanData(null); setExistingDocId(null); setAbsen({ sakit: 0, izin: 0, tanpa_keterangan: 0 }); }
  }

  async function loadHistory() {
    if (!db || !user?.schoolId && !user?.schoolName) return;
    try {
      const schoolId = user?.schoolId || normalizeSchool(user?.schoolName || '').replace(/\s+/g, '-');
      const years = [tahun, '2025', '2024'].map(n => Number(n)).filter(n => n > 0);
      const promises: Promise<void>[] = [];
      const items: any[] = [];
      for (const y of years) {
        for (let m = 1; m <= 12; m++) {
          const ms = String(m).padStart(2, '0');
          promises.push((async () => {
            try {
              const docRef = doc(db!, 'laporanBulanan', String(y), ms, schoolId);
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                items.push({ id: snap.id, ...snap.data() });
              }
            } catch {}
          })());
        }
      }
      await Promise.all(promises);
      items.sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || (bulanList.indexOf(a.bulan || '') - bulanList.indexOf(b.bulan || '')));
      setHistory(items);
    } catch (e) { console.error('Gagal memuat riwayat:', e); }
  }

  async function loadData() {
    setDataLoading(true);
    try {
      let schoolData: any = { name: user?.schoolName || '-', npsn: '-', nss: '-', jenjang: 'SD', status: '-', alamat: '-', desa: '-', kepalaSekolah: '-', akreditasi: '-', kontak: '-', tahunBerdiri: '-' };
      if (db && user?.schoolId) {
        try {
          const snap = await getDoc(doc(db, 'schools', user.schoolId));
          if (snap.exists()) schoolData = { id: snap.id, ...snap.data() };
        } catch (e) { console.error('Gagal memuat data sekolah:', e); }
      }
      setSekolah(schoolData);
      await loadLaporanFromFirestore(schoolData);
      await loadHistory();

      if (db && user?.schoolId) {
        try {
          const snap = await getDoc(doc(db, 'sarpras', user.schoolId));
          if (snap.exists()) setSarpras(snap.data());
        } catch (e) { console.error('Gagal memuat sarpras:', e); }
      }

      let gtkSchools: any[] = [];
      try {
        const gtkRes = await fetch('/api/pegawai/gtk-summary');
        if (gtkRes.ok) {
          const gtkData = await gtkRes.json();
          gtkSchools = gtkData.schools || [];
        }
      } catch (e) { console.error('Gagal memuat GTK:', e); }

      let apiSiswa: any[] = [];
      if (user?.schoolName) {
        try {
          const res = await fetch(`/api/siswa/list?sekolah=${encodeURIComponent(user.schoolName)}`);
          if (res.ok) {
            const data = await res.json();
            apiSiswa = data.siswa || [];
          }
        } catch (e) { console.error('Gagal memuat siswa:', e); }
      }

      const kelasMap: Record<string, { l: number; p: number }> = {};
      let totalL = 0;
      let totalP = 0;
      for (let i = 1; i <= 6; i++) {
        const apiL = apiSiswa.filter((s: any) => String(s.kelas) === String(i) && s.jk === 'L').length;
        const apiP = apiSiswa.filter((s: any) => String(s.kelas) === String(i) && s.jk === 'P').length;
        const laporanL = getSiswaVal(`kelas${i}_l`);
        const laporanP = getSiswaVal(`kelas${i}_p`);
        const lVal = !isNaN(laporanL) ? laporanL : apiL;
        const pVal = !isNaN(laporanP) ? laporanP : apiP;
        kelasMap[`Kelas ${i}`] = { l: lVal, p: pVal };
        totalL += lVal;
        totalP += pVal;
      }
      setPerKelas(kelasMap);
      setSiswaL(totalL);
      setSiswaP(totalP);

      const gtkSchool = gtkSchools.find((g: any) =>
        normalizeSchool(g.name) === normalizeSchool(user?.schoolName || '')
      );

      // Update kepala sekolah dari GTK/PLT jika sekolah tidak punya
      if (gtkSchool?.headmaster && (!sekolah?.kepalaSekolah || sekolah.kepalaSekolah === '-')) {
        setSekolah(prev => prev ? { ...prev, kepalaSekolah: gtkSchool.headmaster } : prev);
        schoolData = { ...schoolData, kepalaSekolah: gtkSchool.headmaster };
      }

      const guruL = getSiswaVal('guru_l');
      const guruP = getSiswaVal('guru_p');
      const tendikL = getSiswaVal('tendik_l');
      const tendikP = getSiswaVal('tendik_p');
      const guruLVal = !isNaN(guruL) ? guruL : (gtkSchool?.teachers_l || 0);
      const guruPVal = !isNaN(guruP) ? guruP : (gtkSchool?.teachers_p || 0);
      const tendikLVal = !isNaN(tendikL) ? tendikL : (gtkSchool?.staff_l || 0);
      const tendikPVal = !isNaN(tendikP) ? tendikP : (gtkSchool?.staff_p || 0);
      setGuru({ l: guruLVal, p: guruPVal, total: guruLVal + guruPVal });
      setTendik({ l: tendikLVal, p: tendikPVal, total: tendikLVal + tendikPVal });
    } catch (e) { console.error('Error:', e); } finally { setLoading(false); setDataLoading(false); }
  }

  async function handleSubmitLaporan() {
    if (!db) { setSubmitMsg('Database tidak tersedia'); setSubmitStatus('error'); return; }
    if (!user?.schoolId && !user?.schoolName) { setSubmitMsg('Data sekolah tidak ditemukan'); setSubmitStatus('error'); return; }

    setSending(true);
    setSubmitStatus('idle');
    setSubmitMsg('');

    try {
      const blnIndex = String(bulanList.indexOf(bulan) + 1).padStart(2, '0');
      const schoolId = user.schoolId || normalizeSchool(user?.schoolName || '').replace(/\s+/g, '-');
      const docPath = `laporanBulanan/${tahun}/${blnIndex}/${schoolId}`;
      const docRef = doc(db, docPath);

      const kelasData: Record<string, number> = {};
      for (let i = 1; i <= 6; i++) {
        const k = perKelas[`Kelas ${i}`] || { l: 0, p: 0 };
        kelasData[`kelas${i}_l`] = k.l;
        kelasData[`kelas${i}_p`] = k.p;
      }

      const payload = {
        sekolahId: schoolId,
        sekolah: user.schoolName || sekolah?.name || '',
        npsn: sekolah?.npsn || '',
        bulan,
        bulanIndex: blnIndex,
        tahun: Number(tahun),
        dataSekolah: {
          nama: sekolah?.name || sekolah?.nama || user?.schoolName || '',
          npsn: sekolah?.npsn || '',
          nss: sekolah?.nss || '',
          jenjang: sekolah?.jenjang || 'SD',
          status: sekolah?.status || '-',
          alamat: sekolah?.alamat || '-',
          desa: sekolah?.desa || '-',
          kepalaSekolah: sekolah?.kepalaSekolah || '-',
        },
        dataSiswa: {
          ...kelasData,
          total_l: siswaL,
          total_p: siswaP,
          total: siswaL + siswaP,
          guru_l: guru.l,
          guru_p: guru.p,
          tendik_l: tendik.l,
          tendik_p: tendik.p,
        },
        dataSarpras: {
          ruang_kelas: sarpras?.ruang_kelas || '',
          perpustakaan: sarpras?.perpustakaan || '',
          uks: sarpras?.uks || '',
          toilet: sarpras?.toilet || '',
          mushola: sarpras?.mushola || '',
          gudang: sarpras?.gudang || '',
          ruang_guru: sarpras?.ruang_guru || '',
          ruang_kepala_sekolah: sarpras?.ruang_kepala_sekolah || '',
          rumah_dinas_kepsek: sarpras?.rumah_dinas_kepsek || '',
          tanah_pemerintah: sarpras?.tanah_pemerintah || '',
          tanah_yayasan: sarpras?.tanah_yayasan || '',
          tanah_perseorangan: sarpras?.tanah_perseorangan || '',
          sumber_air: sarpras?.sumber_air || '',
          menyewa_per_bulan: sarpras?.menyewa_per_bulan || '',
          menumpang_di_sd: sarpras?.menumpang_di_sd || '',
          bangunan_sekolah_p: sarpras?.bangunan_sekolah_p || '',
          bangunan_sekolah_sp: sarpras?.bangunan_sekolah_sp || '',
          bangunan_sekolah_dr: sarpras?.bangunan_sekolah_dr || '',
          r_dinas_kepsek_p: sarpras?.r_dinas_kepsek_p || '',
          r_dinas_kepsek_sp: sarpras?.r_dinas_kepsek_sp || '',
          r_dinas_kepsek_dr: sarpras?.r_dinas_kepsek_dr || '',
          r_dinas_guru_p: sarpras?.r_dinas_guru_p || '',
          r_dinas_guru_sp: sarpras?.r_dinas_guru_sp || '',
          r_dinas_guru_dr: sarpras?.r_dinas_guru_dr || '',
          perpustakaan_p: sarpras?.perpustakaan_p || '',
          perpustakaan_sp: sarpras?.perpustakaan_sp || '',
          perpustakaan_dr: sarpras?.perpustakaan_dr || '',
        },
        dataAbsen: {
          sakit: absen.sakit,
          izin: absen.izin,
          tanpa_keterangan: absen.tanpa_keterangan,
        },
        status: 'sudah_dikirim',
        dikirimOleh: user.uid || '',
        dikirimNama: user.displayName || '',
        dikirimPada: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(docRef, payload, { merge: true });
      setExistingDocId(docRef.id);
      setLaporanData(payload);
      setSubmitStatus('success');
      setSubmitMsg('Laporan bulanan berhasil dikirim!');
      await loadHistory();
    } catch (e: any) {
      console.error('Gagal kirim laporan:', e);
      setSubmitStatus('error');
      setSubmitMsg(`Gagal: ${e.message || 'Terjadi kesalahan'}`);
    } finally {
      setSending(false);
    }
  }

  function getCurrentStatus() {
    if (existingDocId && laporanData?.status === 'sudah_dikirim') return 'sudah_dikirim';
    if (laporanData?.status === 'perlu_revisi') return 'perlu_revisi';
    return 'belum_lapor';
  }

  const currentStatus = getCurrentStatus();
  const statusDef = statusList.find(s => s.value === currentStatus) || statusList[0];
  const StatusIcon = statusDef.icon;
  const totalSiswa = siswaL + siswaP;
  const totalGTK = guru.total + tendik.total;
  const s = laporanData?.dataSekolah || sekolah || {};

  if (!user) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/admin/operator')} className="flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Kembali</span>
          </button>
          <h1 className="text-sm font-bold text-white">Lapor Bulanan</h1>
          <div />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 print:hidden space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <select value={bulan} onChange={(e) => { setBulan(e.target.value); setDataLoading(true); loadData(); }} className="text-sm border rounded-lg px-3 py-2 bg-white" disabled={dataLoading}>
            {bulanList.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={tahun} onChange={(e) => { setTahun(e.target.value); setDataLoading(true); loadData(); }} className="text-sm border rounded-lg px-3 py-2 bg-white" disabled={dataLoading}>
            {[2026, 2025, 2024].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button onClick={() => loadData()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100" disabled={dataLoading}>
            <Loader2 className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} /> {dataLoading ? 'Memuat...' : 'Muat Ulang'}
          </button>
        </div>

        {/* Status Card */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${statusDef.warn}`}>
          <StatusIcon className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{statusDef.label}</p>
            <p className="text-xs opacity-75">
              {currentStatus === 'sudah_dikirim' ? `Dikirim: ${new Date(laporanData?.dikirimPada || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
              {currentStatus === 'perlu_revisi' ? 'Laporan perlu direvisi. Silakan periksa data dan kirim ulang.' : ''}
              {currentStatus === 'belum_lapor' ? 'Belum ada laporan untuk bulan ini.' : ''}
            </p>
          </div>
        </div>

        {/* Peringatan Data Kosong */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w) => (
              <div key={w.page} className="flex items-start gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50">
                <TriangleAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800">{w.label}</p>
                  <p className="text-xs text-amber-700">{w.message}</p>
                  <Link href={w.href} className="text-xs text-blue-600 hover:underline mt-1 inline-block font-medium">
                    Isi data {w.label} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Kirim Laporan Bulanan */}
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-5 h-5 text-[#0d3b66]" />
            <h3 className="font-semibold text-[#0d3b66]">Kirim Laporan Bulanan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Total Siswa</p>
              <p className="text-lg font-bold text-[#0d3b66]">{totalSiswa}</p>
              <p className="text-xs text-gray-400">L: {siswaL} / P: {siswaP}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Guru</p>
              <p className="text-lg font-bold text-[#0d3b66]">{guru.total}</p>
              <p className="text-xs text-gray-400">L: {guru.l} / P: {guru.p}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Tendik</p>
              <p className="text-lg font-bold text-[#0d3b66]">{tendik.total}</p>
              <p className="text-xs text-gray-400">L: {tendik.l} / P: {tendik.p}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Bulan / Tahun</p>
              <p className="text-lg font-bold text-[#0d3b66]">{bulan} {tahun}</p>
            </div>
          </div>

          {/* Absen Murid */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">G. Absen Murid (Bulan Ini)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500">Sakit</label>
                <input type="number" min="0" value={absen.sakit}
                  onChange={(e) => setAbsen(a => ({ ...a, sakit: parseInt(e.target.value) || 0 }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Izin</label>
                <input type="number" min="0" value={absen.izin}
                  onChange={(e) => setAbsen(a => ({ ...a, izin: parseInt(e.target.value) || 0 }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanpa Keterangan</label>
                <input type="number" min="0" value={absen.tanpa_keterangan}
                  onChange={(e) => setAbsen(a => ({ ...a, tanpa_keterangan: parseInt(e.target.value) || 0 }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-white" />
              </div>
            </div>
          </div>

          {submitStatus === 'success' && (
            <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {submitMsg}
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {submitMsg}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSubmitLaporan}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Mengirim...' : existingDocId ? 'Perbarui Laporan' : 'Kirim Laporan Bulanan'}
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100">
              <Printer className="w-4 h-4" /> Cetak Laporan
            </button>
          </div>
        </div>

        {/* Riwayat Laporan */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-[#0d3b66]" />
              <h3 className="font-semibold text-[#0d3b66]">Riwayat Laporan</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2 font-semibold text-gray-600">Bulan</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Tahun</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-2 font-semibold text-gray-600">Dikirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((item) => {
                    const st = statusList.find(s => s.value === item.status) || statusList[0];
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2">{item.bulan}</td>
                        <td className="px-4 py-2">{item.tahun}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.warn}`}>
                            <st.icon className="w-3 h-3" /> {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {item.dikirimPada ? new Date(item.dikirimPada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Print Preview */}
      <div ref={printRef} className="max-w-5xl mx-auto p-2 print:p-0 text-[9px] leading-tight">
        <div className="text-center font-bold text-xs mb-1">DAFTAR I</div>
        <div className="text-center font-bold text-xs mb-1">{s.nama || s.name}</div>
        <div className="text-center text-[9px] mb-2">BULAN: {bulan.toUpperCase()} {tahun}</div>

        <table className="w-full border-collapse border border-black mb-1">
          <thead><tr><th colSpan={99} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">A. TANAH</th></tr></thead>
          <tbody>
            <tr>
              <td className="border border-black px-1 py-0.5 font-semibold text-[8px]" rowSpan={2}>Status *)</td>
              <td className="border border-black px-1 py-0.5 font-semibold text-[8px]" rowSpan={2}>Luasnya (m²)</td>
              <td className="border border-black px-1 py-0.5 font-semibold text-[8px]" rowSpan={2}>No. Persil</td>
              <td className="border border-black px-1 py-0.5 font-semibold text-[8px]" rowSpan={2}>Tahun Pembelian</td>
              <td className="border border-black px-1 py-0.5 font-semibold text-[8px]" rowSpan={2}>Harga (Rp)</td>
            </tr>
            <tr></tr>
            <tr><td className="border border-black px-1 py-0.5">Pemerintah</td><td className="border border-black px-1 py-0.5 text-center">{sarpras?.tanah_pemerintah || '-'}</td><td className="border border-black px-1 py-0.5 text-center">-</td><td className="border border-black px-1 py-0.5 text-center">-</td><td className="border border-black px-1 py-0.5 text-center">-</td></tr>
            <tr><td className="border border-black px-1 py-0.5">Yayasan</td><td className="border border-black px-1 py-0.5 text-center">{sarpras?.tanah_yayasan || '-'}</td><td className="border border-black px-1 py-0.5 text-center">-</td><td className="border border-black px-1 py-0.5 text-center">-</td><td className="border border-black px-1 py-0.5 text-center">-</td></tr>
            <tr><td className="border border-black px-1 py-0.5">Perseorangan</td><td className="border border-black px-1 py-0.5 text-center">{sarpras?.tanah_perseorangan || '-'}</td><td className="border border-black px-1 py-0.5 text-center">-</td><td className="border border-black px-1 py-0.5 text-center">-</td><td className="border border-black px-1 py-0.5 text-center">-</td></tr>
          </tbody>
        </table>

        <table className="w-full border-collapse border border-black mb-1">
          <thead><tr><th colSpan={4} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">IDENTITAS SEKOLAH</th></tr></thead>
          <tbody>
            <tr><td className="border border-black px-1 py-0.5 w-40">Tahun Pendirian</td><td className="border border-black px-1 py-0.5" colSpan={3}>{s.tahunBerdiri || s.tahun_berdiri || '-'}</td></tr>
            <tr><td className="border border-black px-1 py-0.5">NSS / NPSN</td><td className="border border-black px-1 py-0.5" colSpan={3}>{s.nss || '-'} / {s.npsn || '-'}</td></tr>
            <tr><td className="border border-black px-1 py-0.5">Alamat</td><td className="border border-black px-1 py-0.5" colSpan={3}>{s.alamat || '-'}</td></tr>
            <tr><td className="border border-black px-1 py-0.5">Desa / Kecamatan</td><td className="border border-black px-1 py-0.5" colSpan={3}>{s.desa || '-'} / Lemahabang</td></tr>
            <tr><td className="border border-black px-1 py-0.5">Kabupaten</td><td className="border border-black px-1 py-0.5">Cirebon</td><td className="border border-black px-1 py-0.5 w-20">Propinsi</td><td className="border border-black px-1 py-0.5">Jawa Barat</td></tr>
          </tbody>
        </table>

        <table className="w-full border-collapse border border-black mb-1">
          <thead>
            <tr><th colSpan={99} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">B. RUANGAN</th></tr>
            <tr className="bg-gray-50">
              <th className="border border-black px-1 py-0.5 text-[8px]" rowSpan={2}>Jenis Ruangan</th>
              <th className="border border-black px-1 py-0.5 text-[8px]" colSpan={2}>Baik</th>
              <th className="border border-black px-1 py-0.5 text-[8px]" colSpan={2}>Sedang</th>
              <th className="border border-black px-1 py-0.5 text-[8px]" colSpan={2}>Rusak</th>
              <th className="border border-black px-1 py-0.5 text-[8px]" colSpan={2}>Jumlah</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-black px-0.5 py-0.5 text-[7px]">Bgn</th>
              <th className="border border-black px-0.5 py-0.5 text-[7px]">Rgn</th>
              <th className="border border-black px-0.5 py-0.5 text-[7px]">Bgn</th>
              <th className="border border-black px-0.5 py-0.5 text-[7px]">Rgn</th>
              <th className="border border-black px-0.5 py-0.5 text-[7px]">Bgn</th>
              <th className="border border-black px-0.5 py-0.5 text-[7px]">Rgn</th>
              <th className="border border-black px-0.5 py-0.5 text-[7px]">Bgn</th>
              <th className="border border-black px-0.5 py-0.5 text-[7px]">Rgn</th>
            </tr>
          </thead>
          <tbody>
            {['Ruang Kelas', 'Perpustakaan', 'UKS', 'WC/Toilet', 'Mushola', 'Gudang', 'Ruang Guru', 'Ruang Kepala Sekolah', 'Rumah Dinas Kepala Sekolah'].map((item) => {
              const count = getSarprasCount(item);
              return (
                <tr key={item}>
                  <td className="border border-black px-1 py-0.5">{item}</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">{count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <table className="w-full border-collapse border border-black mb-1">
          <thead>
            <tr><th colSpan={99} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">BANYAKNYA MURID</th></tr>
            <tr className="bg-gray-50">
              {['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'Jumlah'].map((h, i) => (
                <th key={i} className="border border-black px-0.5 py-0.5 text-[8px]" colSpan={i === 0 ? 0 : 2}>{h}</th>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-black px-0.5 py-0.5 text-[7px]"></th>
              {Array.from({ length: 7 }, (_, i) => (
                <Fragment key={i}>
                  <th className="border border-black px-0.5 py-0.5 text-[7px] w-6">L</th>
                  <th className="border border-black px-0.5 py-0.5 text-[7px] w-6">P</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black px-1 py-0.5 text-[8px]">Indonesia</td>
              {Array.from({ length: 6 }, (_, i) => {
                const k = `Kelas ${i + 1}`;
                const d = perKelas[k];
                return (
                  <Fragment key={i}>
                    <td className="border border-black px-0.5 py-0.5 text-center text-[8px]">{d?.l || 0}</td>
                    <td className="border border-black px-0.5 py-0.5 text-center text-[8px]">{d?.p || 0}</td>
                  </Fragment>
                );
              })}
              <td className="border border-black px-0.5 py-0.5 text-center text-[8px] font-semibold">{siswaL}</td>
              <td className="border border-black px-0.5 py-0.5 text-center text-[8px] font-semibold">{siswaP}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 text-[8px]">Asing</td>
              {Array.from({ length: 14 }, (_, i) => (
                <td key={i} className="border border-black px-0.5 py-0.5 text-center text-[8px]">-</td>
              ))}
            </tr>
            <tr className="font-semibold">
              <td className="border border-black px-1 py-0.5 text-[8px]">Jumlah</td>
              {Array.from({ length: 6 }, (_, i) => {
                const k = `Kelas ${i + 1}`;
                const d = perKelas[k];
                return (
                  <Fragment key={i}>
                    <td className="border border-black px-0.5 py-0.5 text-center">{d?.l || 0}</td>
                    <td className="border border-black px-0.5 py-0.5 text-center">{d?.p || 0}</td>
                  </Fragment>
                );
              })}
              <td className="border border-black px-0.5 py-0.5 text-center font-bold">{siswaL}</td>
              <td className="border border-black px-0.5 py-0.5 text-center font-bold">{siswaP}</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-1 mb-1">
          <table className="w-full border-collapse border border-black">
            <thead><tr><th colSpan={2} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">C. MENYEWA/MENUMPANG</th></tr></thead>
            <tbody>
              <tr><td className="border border-black px-1 py-0.5 text-[8px]">Menyewa per Bulan (Rp)</td><td className="border border-black px-1 py-0.5 text-center">{getSarprasVal('menyewa_per_bulan')}</td></tr>
              <tr><td className="border border-black px-1 py-0.5 text-[8px]">Menumpang di SD</td><td className="border border-black px-1 py-0.5 text-center">{getSarprasVal('menumpang_di_sd')}</td></tr>
            </tbody>
          </table>
          <table className="w-full border-collapse border border-black">
            <thead><tr><th colSpan={4} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">D. JENIS/SIFAT BANGUNAN</th></tr></thead>
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5 text-[8px] font-semibold">Bangunan</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px]">P</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px]">SP</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px]">DR</td>
              </tr>
              {[['Bangunan Sekolah', 'bangunan_sekolah'], ['R. Dinas Kepsek', 'r_dinas_kepsek'], ['R. Dinas Guru', 'r_dinas_guru'], ['Perpustakaan', 'perpustakaan']].map(([label, prefix]) => (
                <tr key={label}>
                  <td className="border border-black px-1 py-0.5 text-[8px]">{label}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{getSarprasVal(`${prefix}_p`)}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{getSarprasVal(`${prefix}_sp`)}</td>
                  <td className="border border-black px-1 py-0.5 text-center">{getSarprasVal(`${prefix}_dr`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-1 mb-1">
          <table className="w-full border-collapse border border-black">
            <thead><tr><th className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">E. PENYEDIAAN AIR BERSIH</th></tr></thead>
            <tbody>
              <tr><td className="border border-black px-1 py-0.5 text-[8px]">Sumber Air: PAM / Sumur / Mata Air / Sungai</td></tr>
              <tr><td className="border border-black px-1 py-0.5 text-center text-[8px]">{sarpras?.sumber_air || '-'}</td></tr>
            </tbody>
          </table>
          <table className="w-full border-collapse border border-black">
            <thead><tr><th colSpan={4} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">F. PERKAKAS</th></tr></thead>
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5 text-[8px] font-semibold">Jenis</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px] font-semibold">Baik</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px] font-semibold">Rusak</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px] font-semibold">Jml</td>
              </tr>
              {[
                ['Bangku', 'bangku'], ['Meja Murid', 'meja_murid'], ['Kursi Murid', 'kursi_murid'],
                ['Kursi Guru', 'kursi_guru'], ['Meja Guru', 'meja_guru'], ['Lemari', 'lemari'],
                ['Papan Tulis', 'papan_tulis'], ['Kursi Tamu', 'kursi_tamu'], ['Rak Buku', 'rak_buku'],
              ].map(([label, key]) => (
                <tr key={label}>
                  <td className="border border-black px-1 py-0.5 text-[8px]">{label}</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">{sarpras?.[key] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <table className="w-full border-collapse border border-black mb-1">
          <thead><tr><th colSpan={4} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">G. ABSEN MURID (Bulan Ini)</th></tr></thead>
          <tbody>
            <tr>
              <td className="border border-black px-1 py-0.5 text-[8px] font-semibold">Sakit</td>
              <td className="border border-black px-1 py-0.5 text-[8px] font-semibold">Izin</td>
              <td className="border border-black px-1 py-0.5 text-[8px] font-semibold">Tanpa Keterangan</td>
              <td className="border border-black px-1 py-0.5 text-[8px] font-semibold">Jumlah</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 text-center">{absen.sakit}</td>
              <td className="border border-black px-1 py-0.5 text-center">{absen.izin}</td>
              <td className="border border-black px-1 py-0.5 text-center">{absen.tanpa_keterangan}</td>
              <td className="border border-black px-1 py-0.5 text-center">{absen.sakit + absen.izin + absen.tanpa_keterangan}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse border border-black mb-1">
          <thead><tr><th colSpan={4} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">H. GURU DAN TENAGA KEPENDIDIKAN</th></tr></thead>
          <tbody>
            <tr>
              <td className="border border-black px-1 py-0.5 text-[8px] font-semibold">Kategori</td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-semibold">Laki-laki</td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-semibold">Perempuan</td>
              <td className="border border-black px-1 py-0.5 text-center text-[8px] font-semibold">Jumlah</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 text-[8px]">Guru</td>
              <td className="border border-black px-1 py-0.5 text-center">{guru.l}</td>
              <td className="border border-black px-1 py-0.5 text-center">{guru.p}</td>
              <td className="border border-black px-1 py-0.5 text-center font-semibold">{guru.total}</td>
            </tr>
            <tr>
              <td className="border border-black px-1 py-0.5 text-[8px]">Tenaga Kependidikan</td>
              <td className="border border-black px-1 py-0.5 text-center">{tendik.l}</td>
              <td className="border border-black px-1 py-0.5 text-center">{tendik.p}</td>
              <td className="border border-black px-1 py-0.5 text-center font-semibold">{tendik.total}</td>
            </tr>
            <tr className="font-semibold">
              <td className="border border-black px-1 py-0.5 text-[8px]">Jumlah GTK</td>
              <td className="border border-black px-1 py-0.5 text-center">{guru.l + tendik.l}</td>
              <td className="border border-black px-1 py-0.5 text-center">{guru.p + tendik.p}</td>
              <td className="border border-black px-1 py-0.5 text-center">{totalGTK}</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-8 text-[9px] mt-4">
          <div className="text-center">
            <p className="mb-8">Mengetahui</p>
            <p className="font-semibold">Ketua Tim Kecamatan Lemahabang</p>
            <br /><br />
            <p className="font-bold mt-6 underline">Eti Budiwati, S.Pd</p>
          </div>
          <div className="text-center">
            <p className="mb-8">Lemahabang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-semibold">Kepala Sekolah</p>
            <br /><br />
            <p className="font-bold mt-6 underline">{s.kepalaSekolah || 'Mulus, S.Pd'}</p>
          </div>
        </div>
        <p className="text-[7px] text-center mt-1 text-gray-400 print:hidden">*) Coret yang tidak perlu</p>
      </div>

      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 0.8cm; size: A4 landscape; }
        }
      `}</style>
    </div>
  );
}
