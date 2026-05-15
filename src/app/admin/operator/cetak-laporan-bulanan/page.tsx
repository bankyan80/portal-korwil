'use client';

import { useEffect, useState, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { normalizeSchool } from '@/lib/normalize';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function CetakLaporanBulanan() {
  const { user } = useAppStore();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [sekolah, setSekolah] = useState<any>(null);
  const [bulan, setBulan] = useState(bulanList[new Date().getMonth()]);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [perKelas, setPerKelas] = useState<Record<string, { l: number; p: number }>>({});
  const [siswaL, setSiswaL] = useState(0);
  const [siswaP, setSiswaP] = useState(0);
  const [guru, setGuru] = useState({ l: 0, p: 0, total: 0 });
  const [tendik, setTendik] = useState({ l: 0, p: 0, total: 0 });
  const [laporanData, setLaporanData] = useState<any>(null);
  const [sarpras, setSarpras] = useState<any>(null);

  const sarprasRoomMap: Record<string, string> = {
    'Ruang Kelas': 'ruang_kelas', 'Perpustakaan': 'perpustakaan', 'UKS': 'uks',
    'WC/Toilet': 'toilet', 'Mushola': 'mushola', 'Gudang': 'gudang', 'Ruang Guru': 'ruang_guru',
  };

  function getSarprasCount(roomName: string): string {
    const key = sarprasRoomMap[roomName];
    if (!key) return '-';
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

  async function loadLaporanFromFirestore(schoolData: any) {
    if (!db) { setLaporanData(null); return; }
    try {
      const snap = await getDocs(collection(db, 'laporan_bulanan'));
      const normalized = normalizeSchool(schoolData.name || schoolData.nama || '');
      let found = null;
      for (const doc of snap.docs) {
        const d = { id: doc.id, ...doc.data() };
        if (d.bulan !== bulan || String(d.tahun) !== tahun) continue;
        const ds = d.dataSekolah || {};
        if (normalizeSchool(ds.nama || '') === normalized || ds.npsn === schoolData.npsn) {
          found = d; break;
        }
      }
      setLaporanData(found);
    } catch { setLaporanData(null); }
  }

  async function loadData() {
    try {
      let schoolData: any = { name: user?.schoolName || '-', npsn: '-', nss: '-', jenjang: 'SD', status: '-', alamat: '-', desa: '-', kepalaSekolah: '-', akreditasi: '-', kontak: '-', tahunBerdiri: '-' };
      if (db) {
        try {
          const snap = await getDocs(collection(db, 'schools'));
          const normalized = normalizeSchool(user?.schoolName || '');
          for (const d of snap.docs) {
            const s = { id: d.id, ...d.data() };
            if (s.id === user?.schoolId || normalizeSchool(s.name || s.nama || '') === normalized) {
              schoolData = s; break;
            }
          }
        } catch {}
      }
      setSekolah(schoolData);
      await loadLaporanFromFirestore(schoolData);

      if (db && user?.schoolId) {
        try {
          const snap = await getDoc(doc(db, 'sarpras', user.schoolId));
          if (snap.exists()) setSarpras(snap.data());
        } catch {}
      }

      const [siswaRes, gtkRes] = await Promise.all([
        fetch(`/api/siswa/list?sekolah=${encodeURIComponent(user?.schoolName || '')}`),
        fetch('/api/pegawai/gtk-summary'),
      ]);
      const siswaJson = await siswaRes.json();
      const gtkJson = await gtkRes.json();
      const siswaList = siswaJson.siswa || [];
      const gtkSchools = gtkJson.schools || [];

      const kelas: Record<string, { l: number; p: number }> = {};
      let totalL = 0, totalP = 0;

      for (let i = 1; i <= 6; i++) {
        const apiKelas = siswaList.filter((s: any) => s.kelas == i);
        const apiL = apiKelas.filter((s: any) => s.jk === 'L').length;
        const apiP = apiKelas.filter((s: any) => s.jk === 'P').length;
        const laporanL = getSiswaVal(`kelas${i}_l`);
        const laporanP = getSiswaVal(`kelas${i}_p`);
        const lVal = !isNaN(laporanL) ? laporanL : apiL;
        const pVal = !isNaN(laporanP) ? laporanP : apiP;
        kelas[`Kelas ${i}`] = { l: lVal, p: pVal };
        totalL += lVal;
        totalP += pVal;
      }
      setPerKelas(kelas);
      setSiswaL(totalL);
      setSiswaP(totalP);

      const gtkSchool = gtkSchools.find((g: any) =>
        normalizeSchool(g.name) === normalizeSchool(user?.schoolName || '')
      );
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
    } catch (e) { console.error('Error:', e); } finally { setLoading(false); }
  }

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
          <h1 className="text-sm font-bold text-white">Cetak Daftar I Bulanan</h1>
          <div />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 print:hidden space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={bulan} onChange={(e) => { setBulan(e.target.value); loadData(); }} className="text-sm border rounded-lg px-3 py-2 bg-white">
            {bulanList.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={tahun} onChange={(e) => { setTahun(e.target.value); loadData(); }} className="text-sm border rounded-lg px-3 py-2 bg-white">
            {[2026, 2025, 2024].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button onClick={() => loadData()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-100">
            <Loader2 className="w-4 h-4" /> Muat Ulang
          </button>
        </div>
      </div>

      <div ref={printRef} className="max-w-5xl mx-auto p-2 print:p-0 text-[9px] leading-tight">
        {/* ===== KOP ===== */}
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

        {/* ===== IDENTITAS SEKOLAH ===== */}
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

        {/* ===== B. RUANGAN ===== */}
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

        {/* ===== DATA MURID ===== */}
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
          {/* ===== C. MENYEWA/MENUMPANG ===== */}
          <table className="w-full border-collapse border border-black">
            <thead><tr><th colSpan={2} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">C. MENYEWA/MENUMPANG</th></tr></thead>
            <tbody>
              <tr><td className="border border-black px-1 py-0.5 text-[8px]">Menyewa per Bulan (Rp)</td><td className="border border-black px-1 py-0.5 text-center">-</td></tr>
              <tr><td className="border border-black px-1 py-0.5 text-[8px]">Menumpang di SD</td><td className="border border-black px-1 py-0.5 text-center">-</td></tr>
            </tbody>
          </table>

          {/* ===== D. JENIS BANGUNAN ===== */}
          <table className="w-full border-collapse border border-black">
            <thead><tr><th colSpan={4} className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">D. JENIS/SIFAT BANGUNAN</th></tr></thead>
            <tbody>
              <tr>
                <td className="border border-black px-1 py-0.5 text-[8px] font-semibold">Bangunan</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px]">P</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px]">SP</td>
                <td className="border border-black px-1 py-0.5 text-center text-[8px]">DR</td>
              </tr>
              {['Bangunan Sekolah', 'R. Dinas Kepsek', 'R. Dinas Guru', 'Perpustakaan'].map((item) => (
                <tr key={item}>
                  <td className="border border-black px-1 py-0.5 text-[8px]">{item}</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                  <td className="border border-black px-1 py-0.5 text-center">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-1 mb-1">
          {/* ===== E. AIR BERSIH ===== */}
          <table className="w-full border-collapse border border-black">
            <thead><tr><th className="border border-black px-1 py-0.5 text-left text-[9px] bg-gray-100">E. PENYEDIAAN AIR BERSIH</th></tr></thead>
            <tbody>
              <tr><td className="border border-black px-1 py-0.5 text-[8px]">Sumber Air: PAM / Sumur / Mata Air / Sungai</td></tr>
              <tr><td className="border border-black px-1 py-0.5 text-center text-[8px]">{sarpras?.sumber_air || '-'}</td></tr>
            </tbody>
          </table>

          {/* ===== F. PERKAKAS ===== */}
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

        {/* ===== G. ABSEN ===== */}
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
              <td className="border border-black px-1 py-0.5 text-center">-</td>
              <td className="border border-black px-1 py-0.5 text-center">-</td>
              <td className="border border-black px-1 py-0.5 text-center">-</td>
              <td className="border border-black px-1 py-0.5 text-center">-</td>
            </tr>
          </tbody>
        </table>

        {/* ===== H. GURU & TENDIK ===== */}
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

        {/* ===== TTD ===== */}
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


