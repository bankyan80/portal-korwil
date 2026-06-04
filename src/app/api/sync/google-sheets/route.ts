import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import type { ServiceAccount } from 'firebase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';

function getServiceAccount(): ServiceAccount | null {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!envVal) return null;
  try { return JSON.parse(envVal) as ServiceAccount; } catch {
    try { const decoded = Buffer.from(envVal, 'base64').toString('utf-8'); return JSON.parse(decoded) as ServiceAccount; } catch { return null; }
  }
}

function getSheetsClient() {
  const sa = getServiceAccount();
  if (!sa) return null;
  const auth = new google.auth.GoogleAuth({ credentials: sa as any, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  return google.sheets({ version: 'v4', auth });
}

async function syncSheet(sheets: any, range: string, headers: string[], rows: any[][]) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers, ...rows] },
  });
}

async function getCollection(name: string): Promise<any[]> {
  const { data } = await supabaseAdmin!.from('app_data').select('*').eq('collection', name);
  return (data || []).map(r => r.data as any);
}

function fmtDate(ts: any) {
  if (!ts) return '';
  try { return new Date(typeof ts === 'object' && ts.toMillis ? ts.toMillis() : ts).toLocaleDateString('id-ID'); } catch { return String(ts); }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const sheets = getSheetsClient();
  if (!sheets) return NextResponse.json({ error: 'Google Sheets auth failed' }, { status: 500 });

  const results: Record<string, number> = {};

  try {
    // 1. Siswa
    const students = await getCollection('students');
    const studentRows = students.map(d => [d.nik || '', d.nama || '', d.jk || '', d.nisn || '', d.sekolah || '', d.jenjang || '', d.kelas || '', d.desa || '', d.status || 'aktif', d.alasan || '', d.tanggal_lahir || '']);
    await syncSheet(sheets, 'Siswa!A:K', ['NIK', 'Nama', 'JK', 'NISN', 'Sekolah', 'Jenjang', 'Kelas', 'Desa', 'Status', 'Alasan', 'Tgl Lahir'], studentRows);
    results.siswa = studentRows.length;

    // 2. Pegawai
    const employees = await getCollection('employees');
    const empRows = employees.map(d => [d.nik || '', d.nama || '', d.jk || '', d.nuptk || '', d.nip || '', d.sekolah || '', d.jenis_ptk || '', d.tugas_tambahan || '', d.status_kepegawaian || '', d.tanggal_lahir || '']);
    await syncSheet(sheets, 'Pegawai!A:J', ['NIK', 'Nama', 'JK', 'NUPTK', 'NIP', 'Sekolah', 'Jenis PTK', 'Tugas Tambahan', 'Status Kepegawaian', 'Tgl Lahir'], empRows);
    results.pegawai = empRows.length;

    // 3. Pegawai Tambahan
    const pegawaiTambahan = await getCollection('pegawai_tambahan');
    const empTambahanRows = pegawaiTambahan.map(d => [d.nik || '', d.nama || '', d.jk || '', d.nuptk || '', d.nip || '', d.sekolah || '', d.jenis_ptk || '', d.tugas_tambahan || '', d.status_kepegawaian || '', d.tanggal_lahir || '']);
    await syncSheet(sheets, 'Pegawai Tambahan!A:J', ['NIK', 'Nama', 'JK', 'NUPTK', 'NIP', 'Sekolah', 'Jenis PTK', 'Tugas Tambahan', 'Status Kepegawaian', 'Tgl Lahir'], empTambahanRows);
    results.pegawaiTambahan = empTambahanRows.length;

    // 4. Sekolah
    const schools = await getCollection('schools');
    const schoolRows = schools.map(d => [d.id || d.npsn || '', d.name || d.nama || '', d.npsn || '', d.jenjang || '', d.status || '', d.alamat || '', d.desa || '', d.kepalaSekolah || '', d.kontak || '', d.akreditasi || '']);
    await syncSheet(sheets, 'Sekolah!A:J', ['ID', 'Nama', 'NPSN', 'Jenjang', 'Status', 'Alamat', 'Desa', 'Kepala Sekolah', 'Kontak', 'Akreditasi'], schoolRows);
    results.sekolah = schoolRows.length;

    // 5. Sarpras
    const sarpras = await getCollection('sarpras');
    const sarprasRows = sarpras.map(d => [d.schoolId || '', d.ruang_kelas || '', d.perpustakaan || '', d.uks || '', d.toilet || '', d.mushola || '', d.gudang || '', d.ruang_guru || '', d.ruang_kepala_sekolah || '', d.rumah_dinas_kepsek || '', d.tanah_pemerintah || '', d.tanah_yayasan || '', d.tanah_perseorangan || '']);
    await syncSheet(sheets, 'Sarpras!A:M', ['School ID', 'Ruang Kelas', 'Perpustakaan', 'UKS', 'Toilet', 'Mushola', 'Gudang', 'Ruang Guru', 'Ruang Kepsek', 'Rumah Dinas Kepsek', 'Tanah Pemerintah', 'Tanah Yayasan', 'Tanah Perseorangan'], sarprasRows);
    results.sarpras = sarprasRows.length;

    // 6. Laporan Bulanan
    const laporan = await getCollection('laporan_bulanan');
    const laporanRows = laporan.map(d => [d.id || '', d.sekolah || '', d.bulan || '', String(d.tahun || ''), d.status || '', fmtDate(d.dikirimPada), d.dikirimNama || '']);
    await syncSheet(sheets, 'Laporan Bulanan!A:G', ['ID', 'Sekolah', 'Bulan', 'Tahun', 'Status', 'Tanggal Kirim', 'Dikirim Oleh'], laporanRows);
    results.laporanBulanan = laporanRows.length;

    // 7. Berita
    const berita = await getCollection('berita');
    const beritaRows = berita.map(d => [d.id || '', d.judul || '', d.sekolah || '', d.kategori || '', fmtDate(d.tanggal), d.penulis || '', d.status || '']);
    await syncSheet(sheets, 'Berita!A:G', ['ID', 'Judul', 'Sekolah', 'Kategori', 'Tanggal', 'Penulis', 'Status'], beritaRows);
    results.berita = beritaRows.length;

    // 8. Galeri
    const galeri = await getCollection('galeri');
    const galeriRows = galeri.map(d => [d.id || '', d.judul || '', d.kategori || '', d.sekolah || '', d.url || '', fmtDate(d.createdAt)]);
    await syncSheet(sheets, 'Galeri!A:F', ['ID', 'Judul', 'Kategori', 'Sekolah', 'URL', 'Tanggal Upload'], galeriRows);
    results.galeri = galeriRows.length;

    // 9. KIP SD
    const kip = await getCollection('kip_sd');
    const kipRows = kip.map(d => [d.nik || '', d.nama || '', d.sekolah || '', d.desa || '', d.layak_pip || '']);
    await syncSheet(sheets, 'KIP SD!A:E', ['NIK', 'Nama', 'Sekolah', 'Desa', 'Layak PIP'], kipRows);
    results.kipSd = kipRows.length;

    // 10. Yatim Piatu
    const yatim = await getCollection('yatim_piatu');
    const yatimRows = yatim.map(d => [d.nik || '', d.nama || '', d.sekolah || '', d.desa || '', d.kategori || '']);
    await syncSheet(sheets, 'Yatim Piatu!A:E', ['NIK', 'Nama', 'Sekolah', 'Desa', 'Kategori'], yatimRows);
    results.yatimPiatu = yatimRows.length;

    // 11. SPMB SD
    const spmb = await getCollection('spmb_sd');
    const spmbRows = spmb.map(d => [d.id || '', d.nama || '', d.nik || '', d.sekolah || '', d.desa || '', d.status || '', fmtDate(d.createdAt)]);
    await syncSheet(sheets, 'SPMB SD!A:G', ['ID', 'Nama', 'NIK', 'Sekolah', 'Desa', 'Status', 'Tanggal Daftar'], spmbRows);
    results.spmbSd = spmbRows.length;

    // 12. Tugas
    const tugas = await getCollection('task_groups');
    const tugasRows = tugas.map(d => [d.id || '', d.title || '', d.description || '', d.schoolId || '', d.schoolName || '', d.completed ? 'Ya' : 'Tidak', d.targetLink || '']);
    await syncSheet(sheets, 'Tugas!A:G', ['ID', 'Judul', 'Deskripsi', 'School ID', 'Nama Sekolah', 'Selesai', 'Target Link'], tugasRows);
    results.tugas = tugasRows.length;

    return NextResponse.json({ success: true, ...results });
  } catch (e: any) {
    console.error('[sheets-sync] Error:', e);
    return NextResponse.json({ error: e.message, partial: results }, { status: 500 });
  }
}
