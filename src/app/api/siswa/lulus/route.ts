import { NextResponse } from 'next/server';
import siswaAll from '@/data/data-siswa.json';
import { allSekolah } from '@/data/sekolah';

export async function GET() {
  try {
    const allSiswa = [...siswaAll] as any[];

    const sdKelas6 = allSiswa.filter(
      (s) =>
        s.jenjang === 'SD' &&
        (s.kelas === 6 || (s.kelas == null && /VI|6/i.test(s.rombel || '')))
    );

    const sekolahMap = new Map(allSekolah.map((s) => [s.npsn, s.nama]));

    const perSekolah: Record<string, { npsn: string; nama: string; l: number; p: number; total: number }> = {};

    for (const s of sdKelas6) {
      const npsn = s.npsn;
      if (!perSekolah[npsn]) {
        perSekolah[npsn] = {
          npsn,
          nama: sekolahMap.get(npsn) || s.sekolah || 'Tidak Diketahui',
          l: 0,
          p: 0,
          total: 0,
        };
      }
      if (s.jk === 'L') perSekolah[npsn].l++;
      else perSekolah[npsn].p++;
      perSekolah[npsn].total++;
    }

    const sekolah = Object.values(perSekolah).sort((a, b) => a.nama.localeCompare(b.nama));
    const totalL = sekolah.reduce((s, x) => s + x.l, 0);
    const totalP = sekolah.reduce((s, x) => s + x.p, 0);
    const totalAll = sekolah.reduce((s, x) => s + x.total, 0);

    return NextResponse.json({
      success: true,
      total: totalAll,
      totalL,
      totalP,
      jumlahSekolah: sekolah.length,
      sekolah,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil data siswa lulus' }, { status: 500 });
  }
}
