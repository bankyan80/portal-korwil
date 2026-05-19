import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';

const SPREADSHEET_ID = '14v0ykMflGpnb-m-FbhG-GvNieMTFs_t_u3v4KOMxijQ';

function getServiceAccount(): ServiceAccount | null {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  console.log('[sheets-sync] ENV length:', envVal?.length);
  if (!envVal) return null;
  try {
    return JSON.parse(envVal) as ServiceAccount;
  } catch {
    try {
      const decoded = Buffer.from(envVal, 'base64').toString('utf-8');
      return JSON.parse(decoded) as ServiceAccount;
    } catch {
      return null;
    }
  }
}

function getAdminDb() {
  const sa = getServiceAccount();
  if (!sa) return null;
  if (!getApps().length) {
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

function getSheetsClient() {
  const sa = getServiceAccount();
  if (!sa) return null;
  const auth = new google.auth.GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function syncSheet(sheets: any, range: string, headers: string[], rows: any[][]) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers, ...rows] },
  });
}

function fmtDate(ts: any) {
  if (!ts) return '';
  try { return new Date(ts.toMillis ? ts.toMillis() : ts).toLocaleDateString('id-ID'); }
  catch { return String(ts); }
}

export async function POST() {
  console.log('[sheets-sync] Starting sync...');
  const db = getAdminDb();
  const sheets = getSheetsClient();
  
  console.log('[sheets-sync] DB ready:', !!db);
  console.log('[sheets-sync] Sheets ready:', !!sheets);

  if (!db) {
    console.error('[sheets-sync] Firebase admin not configured');
    return NextResponse.json({ error: 'Firebase admin not configured' }, { status: 500 });
  }
  if (!sheets) {
    console.error('[sheets-sync] Google Sheets auth failed');
    return NextResponse.json({ error: 'Google Sheets auth failed' }, { status: 500 });
  }

  const results: Record<string, number> = {};

  try {
    // 1. Siswa
    console.log('[sheets-sync] Fetching students...');
    const studentsSnap = await db.collection('students').get();
    const studentRows: any[][] = [];
    studentsSnap.forEach(doc => {
      const d = doc.data();
      studentRows.push([
        d.nik || '', d.nama || '', d.jk || '', d.nisn || '',
        d.sekolah || '', d.jenjang || '', d.kelas || '', d.desa || '',
        d.status || 'aktif', d.alasan || '', d.tanggal_lahir || ''
      ]);
    });
    console.log(`[sheets-sync] Students: ${studentRows.length} rows`);
    await syncSheet(sheets, 'Siswa!A:K', [
      'NIK', 'Nama', 'JK', 'NISN', 'Sekolah', 'Jenjang', 'Kelas', 'Desa', 'Status', 'Alasan', 'Tgl Lahir'
    ], studentRows);
    results.siswa = studentRows.length;

    // 2. Pegawai
    console.log('[sheets-sync] Fetching employees...');
    const empSnap = await db.collection('employees').get();
    const empRows: any[][] = [];
    empSnap.forEach(doc => {
      const d = doc.data();
      empRows.push([
        d.nik || '', d.nama || '', d.jk || '', d.nuptk || '', d.nip || '',
        d.sekolah || '', d.jenis_ptk || '', d.tugas_tambahan || '',
        d.status_kepegawaian || '', d.tanggal_lahir || ''
      ]);
    });
    console.log(`[sheets-sync] Employees: ${empRows.length} rows`);
    await syncSheet(sheets, 'Pegawai!A:J', [
      'NIK', 'Nama', 'JK', 'NUPTK', 'NIP', 'Sekolah', 'Jenis PTK', 'Tugas Tambahan', 'Status Kepegawaian', 'Tgl Lahir'
    ], empRows);
    results.pegawai = empRows.length;

    // 3. Pegawai Tambahan
    console.log('[sheets-sync] Fetching pegawai_tambahan...');
    const empTambahanSnap = await db.collection('pegawai_tambahan').get();
    const empTambahanRows: any[][] = [];
    empTambahanSnap.forEach(doc => {
      const d = doc.data();
      empTambahanRows.push([
        d.nik || '', d.nama || '', d.jk || '', d.nuptk || '', d.nip || '',
        d.sekolah || '', d.jenis_ptk || '', d.tugas_tambahan || '',
        d.status_kepegawaian || '', d.tanggal_lahir || ''
      ]);
    });
    console.log(`[sheets-sync] Pegawai Tambahan: ${empTambahanRows.length} rows`);
    await syncSheet(sheets, 'Pegawai Tambahan!A:J', [
      'NIK', 'Nama', 'JK', 'NUPTK', 'NIP', 'Sekolah', 'Jenis PTK', 'Tugas Tambahan', 'Status Kepegawaian', 'Tgl Lahir'
    ], empTambahanRows);
    results.pegawaiTambahan = empTambahanRows.length;

    // 4. Sekolah
    console.log('[sheets-sync] Fetching schools...');
    const schoolsSnap = await db.collection('schools').get();
    const schoolRows: any[][] = [];
    schoolsSnap.forEach(doc => {
      const d = doc.data();
      schoolRows.push([
        d.id || '', d.name || '', d.npsn || '', d.jenjang || '',
        d.status || '', d.alamat || '', d.desa || '',
        d.kepalaSekolah || '', d.kontak || '', d.akreditasi || ''
      ]);
    });
    console.log(`[sheets-sync] Schools: ${schoolRows.length} rows`);
    await syncSheet(sheets, 'Sekolah!A:J', [
      'ID', 'Nama', 'NPSN', 'Jenjang', 'Status', 'Alamat', 'Desa', 'Kepala Sekolah', 'Kontak', 'Akreditasi'
    ], schoolRows);
    results.sekolah = schoolRows.length;

    // 5. Sarpras
    console.log('[sheets-sync] Fetching sarpras...');
    const sarprasSnap = await db.collection('sarpras').get();
    const sarprasRows: any[][] = [];
    sarprasSnap.forEach(doc => {
      const d = doc.data();
      sarprasRows.push([
        d.schoolId || '', d.ruang_kelas || '', d.perpustakaan || '', d.uks || '',
        d.toilet || '', d.mushola || '', d.gudang || '', d.ruang_guru || '',
        d.ruang_kepala_sekolah || '', d.rumah_dinas_kepsek || '',
        d.tanah_pemerintah || '', d.tanah_yayasan || '', d.tanah_perseorangan || ''
      ]);
    });
    console.log(`[sheets-sync] Sarpras: ${sarprasRows.length} rows`);
    await syncSheet(sheets, 'Sarpras!A:M', [
      'School ID', 'Ruang Kelas', 'Perpustakaan', 'UKS', 'Toilet', 'Mushola', 'Gudang', 'Ruang Guru', 'Ruang Kepsek', 'Rumah Dinas Kepsek', 'Tanah Pemerintah', 'Tanah Yayasan', 'Tanah Perseorangan'
    ], sarprasRows);
    results.sarpras = sarprasRows.length;

    // 6. Laporan Bulanan
    console.log('[sheets-sync] Fetching laporan_bulanan...');
    const laporanSnap = await db.collection('laporan_bulanan').get();
    const laporanRows: any[][] = [];
    laporanSnap.forEach(doc => {
      const d = doc.data();
      laporanRows.push([
        d.id || '', d.sekolah || '', d.bulan || '', d.tahun || '',
        d.status || '', fmtDate(d.dikirimPada) || '', d.dikirimNama || ''
      ]);
    });
    console.log(`[sheets-sync] Laporan Bulanan: ${laporanRows.length} rows`);
    await syncSheet(sheets, 'Laporan Bulanan!A:G', [
      'ID', 'Sekolah', 'Bulan', 'Tahun', 'Status', 'Tanggal Kirim', 'Dikirim Oleh'
    ], laporanRows);
    results.laporanBulanan = laporanRows.length;

    // 7. Berita
    console.log('[sheets-sync] Fetching berita...');
    const beritaSnap = await db.collection('berita').get();
    const beritaRows: any[][] = [];
    beritaSnap.forEach(doc => {
      const d = doc.data();
      beritaRows.push([
        d.id || '', d.judul || '', d.sekolah || '', d.kategori || '',
        fmtDate(d.tanggal) || '', d.penulis || '', d.status || ''
      ]);
    });
    console.log(`[sheets-sync] Berita: ${beritaRows.length} rows`);
    await syncSheet(sheets, 'Berita!A:G', [
      'ID', 'Judul', 'Sekolah', 'Kategori', 'Tanggal', 'Penulis', 'Status'
    ], beritaRows);
    results.berita = beritaRows.length;

    // 8. Galeri
    console.log('[sheets-sync] Fetching galeri...');
    const galeriSnap = await db.collection('galeri').get();
    const galeriRows: any[][] = [];
    galeriSnap.forEach(doc => {
      const d = doc.data();
      galeriRows.push([
        d.id || '', d.judul || '', d.kategori || '', d.sekolah || '',
        d.url || '', fmtDate(d.createdAt) || ''
      ]);
    });
    console.log(`[sheets-sync] Galeri: ${galeriRows.length} rows`);
    await syncSheet(sheets, 'Galeri!A:F', [
      'ID', 'Judul', 'Kategori', 'Sekolah', 'URL', 'Tanggal Upload'
    ], galeriRows);
    results.galeri = galeriRows.length;

    // 9. KIP SD
    console.log('[sheets-sync] Fetching kip_sd...');
    const kipSnap = await db.collection('kip_sd').get();
    const kipRows: any[][] = [];
    kipSnap.forEach(doc => {
      const d = doc.data();
      kipRows.push([
        d.nik || '', d.nama || '', d.sekolah || '', d.desa || '',
        d.layak_pip || ''
      ]);
    });
    console.log(`[sheets-sync] KIP SD: ${kipRows.length} rows`);
    await syncSheet(sheets, 'KIP SD!A:E', [
      'NIK', 'Nama', 'Sekolah', 'Desa', 'Layak PIP'
    ], kipRows);
    results.kipSd = kipRows.length;

    // 10. Yatim Piatu
    console.log('[sheets-sync] Fetching yatim_piatu...');
    const yatimSnap = await db.collection('yatim_piatu').get();
    const yatimRows: any[][] = [];
    yatimSnap.forEach(doc => {
      const d = doc.data();
      yatimRows.push([
        d.nik || '', d.nama || '', d.sekolah || '', d.desa || '',
        d.kategori || ''
      ]);
    });
    console.log(`[sheets-sync] Yatim Piatu: ${yatimRows.length} rows`);
    await syncSheet(sheets, 'Yatim Piatu!A:E', [
      'NIK', 'Nama', 'Sekolah', 'Desa', 'Kategori'
    ], yatimRows);
    results.yatimPiatu = yatimRows.length;

    // 11. SPMB SD
    console.log('[sheets-sync] Fetching spmb_sd...');
    const spmbSnap = await db.collection('spmb_sd').get();
    const spmbRows: any[][] = [];
    spmbSnap.forEach(doc => {
      const d = doc.data();
      spmbRows.push([
        d.id || '', d.nama || '', d.nik || '', d.sekolah || '',
        d.desa || '', d.status || '', fmtDate(d.createdAt) || ''
      ]);
    });
    console.log(`[sheets-sync] SPMB SD: ${spmbRows.length} rows`);
    await syncSheet(sheets, 'SPMB SD!A:G', [
      'ID', 'Nama', 'NIK', 'Sekolah', 'Desa', 'Status', 'Tanggal Daftar'
    ], spmbRows);
    results.spmbSd = spmbRows.length;

    // 12. Tugas
    console.log('[sheets-sync] Fetching tugas...');
    const tugasSnap = await db.collection('tugas').get();
    const tugasRows: any[][] = [];
    tugasSnap.forEach(doc => {
      const d = doc.data();
      tugasRows.push([
        d.id || '', d.title || '', d.description || '', d.schoolId || '',
        d.schoolName || '', d.completed ? 'Ya' : 'Tidak', d.targetLink || ''
      ]);
    });
    console.log(`[sheets-sync] Tugas: ${tugasRows.length} rows`);
    await syncSheet(sheets, 'Tugas!A:G', [
      'ID', 'Judul', 'Deskripsi', 'School ID', 'Nama Sekolah', 'Selesai', 'Target Link'
    ], tugasRows);
    results.tugas = tugasRows.length;

    console.log('[sheets-sync] All done:', results);
    return NextResponse.json({ success: true, ...results });
  } catch (e: any) {
    console.error('[sheets-sync] Error:', e);
    return NextResponse.json({ error: e.message, partial: results }, { status: 500 });
  }
}
