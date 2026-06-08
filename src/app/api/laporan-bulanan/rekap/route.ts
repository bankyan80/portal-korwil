import { NextResponse } from 'next/server';
import pegawaiSdData from '@/data/data-pegawai.json';
import pegawaiTkData from '@/data/data-pegawai-tk.json';
import siswaAll from '@/data/data-siswa.json';

const bulanList = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function isTkKb(j: string) {
  return j === 'TK' || j === 'KB' || j === 'PAUD';
}

export async function GET() {
  try {
    const allSiswa = [...siswaAll] as any[];

    const pegawaiPerJenjang = {
      sd: [...pegawaiSdData] as any[],
      tk: [...pegawaiTkData] as any[],
    };

    const siswaSd = allSiswa.filter((s) => s.jenjang === 'SD');
    const siswaTkKb = allSiswa.filter((s) => isTkKb(s.jenjang || ''));

    const pegawaiSdGuru = pegawaiPerJenjang.sd.filter((p) => p.jenis_ptk === 'Guru');
    const pegawaiSdTendik = pegawaiPerJenjang.sd.filter((p) => p.jenis_ptk !== 'Guru');
    const pegawaiSdL = pegawaiPerJenjang.sd.filter((p) => p.jk === 'L');
    const pegawaiSdP = pegawaiPerJenjang.sd.filter((p) => p.jk === 'P');

    const pegawaiTkGuru = pegawaiPerJenjang.tk.filter((p) => p.jenis_ptk === 'Guru');
    const pegawaiTkTendik = pegawaiPerJenjang.tk.filter((p) => p.jenis_ptk !== 'Guru');
    const pegawaiTkL = pegawaiPerJenjang.tk.filter((p) => p.jk === 'L');
    const pegawaiTkP = pegawaiPerJenjang.tk.filter((p) => p.jk === 'P');

    const siswaSdL = siswaSd.filter((s) => s.jk === 'L');
    const siswaSdP = siswaSd.filter((s) => s.jk === 'P');
    const siswaTkKbL = siswaTkKb.filter((s) => s.jk === 'L');
    const siswaTkKbP = siswaTkKb.filter((s) => s.jk === 'P');

    const pegawaiBySekolah: Record<string, any[]> = {};
    const siswaBySekolah: Record<string, any[]> = {};

    [...pegawaiPerJenjang.sd, ...pegawaiPerJenjang.tk].forEach((p) => {
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

    const bulan = bulanList.map((nama, idx) => ({
      nama,
      index: idx + 1,
      sd: {
        pegawai: {
          total: pegawaiPerJenjang.sd.length,
          l: pegawaiSdL.length,
          p: pegawaiSdP.length,
          guru: pegawaiSdGuru.length,
          tendik: pegawaiSdTendik.length,
        },
        siswa: {
          total: siswaSd.length,
          l: siswaSdL.length,
          p: siswaSdP.length,
        },
      },
      tkKb: {
        pegawai: {
          total: pegawaiPerJenjang.tk.length,
          l: pegawaiTkL.length,
          p: pegawaiTkP.length,
          guru: pegawaiTkGuru.length,
          tendik: pegawaiTkTendik.length,
        },
        siswa: {
          total: siswaTkKb.length,
          l: siswaTkKbL.length,
          p: siswaTkKbP.length,
        },
      },
    }));

    const totalPegawaiSd = pegawaiPerJenjang.sd.length;
    const totalPegawaiTk = pegawaiPerJenjang.tk.length;
    const totalSiswaSd = siswaSd.length;
    const totalSiswaTkKb = siswaTkKb.length;

    return NextResponse.json({
      success: true,
      tahun: new Date().getFullYear(),
      totalSekolah: sekolahList.length,
      totalPegawai: totalPegawaiSd + totalPegawaiTk,
      totalSiswa: totalSiswaSd + totalSiswaTkKb,
      sd: { pegawai: totalPegawaiSd, siswa: totalSiswaSd },
      tkKb: { pegawai: totalPegawaiTk, siswa: totalSiswaTkKb },
      bulan,
      sekolah: sekolahList,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil data rekap' }, { status: 500 });
  }
}
