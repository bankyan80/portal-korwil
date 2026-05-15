import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { normalizeSchool } from '@/lib/normalize';
import type { Query } from 'firebase-admin/firestore';
import siswaData from '@/data/data-siswa.json';

export async function GET(req: NextRequest) {
  const jenjang = req.nextUrl.searchParams.get('jenjang');
  const layak_pip = req.nextUrl.searchParams.get('layak_pip');
  const sekolah = req.nextUrl.searchParams.get('sekolah');
  const search = req.nextUrl.searchParams.get('search');

  // Try Firestore first, fall back to static JSON
  if (isFirebaseAdminConfigured && adminDb) {
    try {
      let query: Query = adminDb.collection('students');

      if (jenjang) query = query.where('jenjang', '==', jenjang);
      if (layak_pip) query = query.where('layak_pip', '==', layak_pip);

      const snapshot = await query.get();
      let all = snapshot.docs.map((doc) => ({ nik: doc.id, ...doc.data() }));

      // If Firestore returns 0 results, fall back to static JSON
      // This happens when Firebase quotas are exceeded or collection is empty
      if (all.length === 0) {
        throw new Error('Empty result from Firestore, fallback to static');
      }

      if (sekolah) {
        const q = normalizeSchool(sekolah);
        all = all.filter((s: any) => normalizeSchool(s.sekolah || '') === q);
      }
      if (search) {
        const q = search.toLowerCase();
        all = all.filter((s: any) => s.nama?.toLowerCase().includes(q) || s.nik?.includes(q));
      }

      return NextResponse.json({
        count: all.length,
        siswa: all.map((s: any) => ({
          nik: s.nik, nama: s.nama, jk: s.jk, nisn: s.nisn,
          tanggal_lahir: s.tanggal_lahir, sekolah: s.sekolah,
          jenjang: s.jenjang, desa: s.desa, layak_pip: s.layak_pip,
          kelas: s.kelas,
          nipd: s.nipd, tempat_lahir: s.tempat_lahir,
          agama: s.agama, alamat: s.alamat,
          rt: s.rt, rw: s.rw, dusun: s.dusun,
          kecamatan: s.kecamatan, kode_pos: s.kode_pos,
          jenis_tinggal: s.jenis_tinggal, alat_transportasi: s.alat_transportasi,
          telepon: s.telepon, hp: s.hp, email: s.email,
          skhun: s.skhun, penerima_kps: s.penerima_kps, no_kps: s.no_kps,
          data_ayah: s.data_ayah, data_ibu: s.data_ibu, data_wali: s.data_wali,
          rombel: s.rombel, no_peserta_ujian: s.no_peserta_ujian,
          no_seri_ijazah: s.no_seri_ijazah,
          penerima_kip: s.penerima_kip, nomor_kip: s.nomor_kip,
          nama_di_kip: s.nama_di_kip, nomor_kks: s.nomor_kks,
          no_reg_akta_lahir: s.no_reg_akta_lahir,
          bank: s.bank, nomor_rekening: s.nomor_rekening,
          rekening_atas_nama: s.rekening_atas_nama,
          alasan_layak_pip: s.alasan_layak_pip,
          kebutuhan_khusus: s.kebutuhan_khusus, sekolah_asal: s.sekolah_asal,
          anak_ke: s.anak_ke, lintang: s.lintang, bujur: s.bujur,
          no_kk: s.no_kk, berat_badan: s.berat_badan,
          tinggi_badan: s.tinggi_badan, lingkar_kepala: s.lingkar_kepala,
          jumlah_saudara: s.jumlah_saudara, jarak_rumah_km: s.jarak_rumah_km,
        })),
      });
    } catch (error) {
      console.error('Error fetching siswa from Firestore:', error);
    }
  }

  // Fallback to static JSON
  let all = siswaData as any[];

  if (jenjang) all = all.filter((s) => s.jenjang === jenjang);
  if (layak_pip) all = all.filter((s) => s.layak_pip === layak_pip);
  if (sekolah) {
    const q = normalizeSchool(sekolah);
    all = all.filter((s) => normalizeSchool(s.sekolah || '') === q);
  }
  if (search) {
    const q = search.toLowerCase();
    all = all.filter((s) => s.nama?.toLowerCase().includes(q) || s.nik?.includes(q));
  }

  return NextResponse.json({
    count: all.length,
    siswa: all.map((s: any) => ({
      nik: s.nik, nama: s.nama, jk: s.jk, nisn: s.nisn,
      tanggal_lahir: s.tanggal_lahir, sekolah: s.sekolah,
      jenjang: s.jenjang, desa: s.desa, layak_pip: s.layak_pip,
      kelas: s.kelas,
      nipd: s.nipd, tempat_lahir: s.tempat_lahir,
      agama: s.agama, alamat: s.alamat,
      rt: s.rt, rw: s.rw, dusun: s.dusun,
      kecamatan: s.kecamatan, kode_pos: s.kode_pos,
      jenis_tinggal: s.jenis_tinggal, alat_transportasi: s.alat_transportasi,
      telepon: s.telepon, hp: s.hp, email: s.email,
      skhun: s.skhun, penerima_kps: s.penerima_kps, no_kps: s.no_kps,
      data_ayah: s.data_ayah, data_ibu: s.data_ibu, data_wali: s.data_wali,
      rombel: s.rombel, no_peserta_ujian: s.no_peserta_ujian,
      no_seri_ijazah: s.no_seri_ijazah,
      penerima_kip: s.penerima_kip, nomor_kip: s.nomor_kip,
      nama_di_kip: s.nama_di_kip, nomor_kks: s.nomor_kks,
      no_reg_akta_lahir: s.no_reg_akta_lahir,
      bank: s.bank, nomor_rekening: s.nomor_rekening,
      rekening_atas_nama: s.rekening_atas_nama,
      alasan_layak_pip: s.alasan_layak_pip,
      kebutuhan_khusus: s.kebutuhan_khusus, sekolah_asal: s.sekolah_asal,
      anak_ke: s.anak_ke, lintang: s.lintang, bujur: s.bujur,
      no_kk: s.no_kk, berat_badan: s.berat_badan,
      tinggi_badan: s.tinggi_badan, lingkar_kepala: s.lingkar_kepala,
      jumlah_saudara: s.jumlah_saudara, jarak_rumah_km: s.jarak_rumah_km,
    })),
  });
}
