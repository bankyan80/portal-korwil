import { NextResponse } from 'next/server';
import pegawaiSd from '@/data/data-pegawai.json';
import pegawaiTk from '@/data/data-pegawai-tk.json';
import siswaAll from '@/data/data-siswa.json';

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export async function GET() {
  try {
    const allPegawai = [...pegawaiSd, ...pegawaiTk] as any[];
    const allSiswa = [...siswaAll] as any[];

    const pegawaiBySekolah: Record<string, any[]> = {};
    const siswaBySekolah: Record<string, any[]> = {};

    allPegawai.forEach((p) => {
      const key = p.sekolah || 'Unknown';
      if (!pegawaiBySekolah[key]) pegawaiBySekolah[key] = [];
      pegawaiBySekolah[key].push(p);
    });

    allSiswa.forEach((s) => {
      const key = s.sekolah || 'Unknown';
      if (!siswaBySekolah[key]) siswaBySekolah[key] = [];
      siswaBySekolah[key].push(s);
    });

    const sekolahList = Array.from(new Set([
      ...Object.keys(pegawaiBySekolah),
      ...Object.keys(siswaBySekolah),
    ])).sort();

    const pegawaiGuru = allPegawai.filter((p) => p.jenis_ptk === 'Guru');
    const pegawaiTendik = allPegawai.filter((p) => p.jenis_ptk !== 'Guru');
    const pegawaiL = allPegawai.filter((p) => p.jk === 'L');
    const pegawaiP = allPegawai.filter((p) => p.jk === 'P');
    const siswaL = allSiswa.filter((s) => s.jk === 'L');
    const siswaP = allSiswa.filter((s) => s.jk === 'P');

    const siswaByKelas: Record<string, number> = {};
    allSiswa.forEach((s) => {
      const k = String(s.kelas ?? 'unknown');
      siswaByKelas[k] = (siswaByKelas[k] || 0) + 1;
    });

    const totalSekolah = sekolahList.length;
    const totalPegawai = allPegawai.length;
    const totalSiswa = allSiswa.length;

    const tahunSekarang = new Date().getFullYear();

    const bulan = bulanList.map((nama, idx) => ({
      nama,
      index: idx + 1,
      pegawai: {
        total: totalPegawai,
        l: pegawaiL.length,
        p: pegawaiP.length,
        guru: pegawaiGuru.length,
        tendik: pegawaiTendik.length,
      },
      siswa: {
        total: totalSiswa,
        l: siswaL.length,
        p: siswaP.length,
        perKelas: siswaByKelas,
      },
    }));

    return NextResponse.json({
      success: true,
      tahun: tahunSekarang,
      totalSekolah,
      totalPegawai,
      totalSiswa,
      bulan,
      sekolah: sekolahList,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil data rekap' }, { status: 500 });
  }
}
