import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ROOT_ID || '1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ';

function getServiceAccount(): any | null {
  const envVal = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!envVal) return null;
  try { return JSON.parse(envVal); } catch {}
  try { return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8')); } catch {}
  return null;
}

function getAuthClient() {
  const sa = getServiceAccount();
  if (!sa) return null;
  return new google.auth.GoogleAuth({
    credentials: sa as any,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

function loadJson(filename: string): any[] {
  const p = path.join(process.cwd(), 'src', 'data', filename);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function fmtDate(ts: any) {
  if (!ts) return '';
  try { return new Date(ts.toMillis ? ts.toMillis() : ts).toLocaleDateString('id-ID'); }
  catch { return String(ts); }
}

async function getOrCreateSpreadsheet(drive: any): Promise<{ id: string; url: string }> {
  const existingId = process.env.GOOGLE_SHEET_ID;
  if (existingId) {
    try {
      await drive.files.get({ fileId: existingId, fields: 'id' });
      return { id: existingId, url: `https://docs.google.com/spreadsheets/d/${existingId}` };
    } catch {
      console.log('[cron] Existing spreadsheet not found via GOOGLE_SHEET_ID, creating new one');
    }
  }

  const fileRes = await drive.files.create({
    requestBody: {
      name: 'Data Portal Korwil - Auto Sync',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      parents: [DRIVE_FOLDER_ID],
    },
    fields: 'id, name, webViewLink',
  });

  await drive.permissions.create({
    fileId: fileRes.data.id!,
    requestBody: { role: 'writer', type: 'anyone' },
  });

  return { id: fileRes.data.id!, url: fileRes.data.webViewLink! };
}

async function syncSheetData(sheets: any, spreadsheetId: string, sheetTitle: string, sheetId: number, headers: string[], rows: any[][], colCount: number) {
  const requests: any[] = [
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          title: sheetTitle,
          gridProperties: { rowCount: Math.max(1000, rows.length + 10) },
        },
        fields: 'title,gridProperties',
      },
    },
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: colCount,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.1, green: 0.3, blue: 0.6 },
            textColor: { red: 1, green: 1, blue: 1 },
            textFormat: { bold: true },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textColor,textFormat)',
      },
    },
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    },
  ];

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetTitle}!A:${String.fromCharCode(64 + colCount)}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers, ...rows] },
  });
}

export async function POST(req: Request) {
  const isVercelCron = req.headers.get('x-vercel-signature') !== null;
  const isRefererPortal = (req.headers.get('referer') || '').includes('portalkorwil.online');
  const authHeader = req.headers.get('authorization');
  const hasSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isRefererPortal && !hasSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const auth = getAuthClient();

  if (!auth) {
    return NextResponse.json({ error: 'Service account not configured' }, { status: 500 });
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    const spreadsheet = await getOrCreateSpreadsheet(drive);

    // Baca siswa dari static JSON
    const siswaList = loadJson('data-siswa.json');
    const studentRows: any[][] = siswaList.map((d: any) => [
      d.nik || '', d.nama || '', d.jk || d.jenis_kelamin || '', d.nisn || '',
      d.sekolah || '', d.jenjang || '', d.kelas ?? '', d.desa || '',
      'aktif', d.tanggal_lahir || '', d.tempat_lahir || '',
      d.alamat || '', d.hp || d.telepon || '',
      d.data_ayah?.nama || '', d.data_ibu?.nama || '',
      d.data_ayah?.pekerjaan || '', d.data_ibu?.pekerjaan || '',
      d.penerima_kip || '', d.nomor_kip || '', '',
    ]);

    // Baca pegawai dari static JSON
    const pegawaiList = loadJson('data-pegawai.json');
    const empRows: any[][] = pegawaiList.map((d: any) => [
      d.nik || '', d.nama || '', d.jk || d.jenis_kelamin || '', d.nuptk || '',
      d.nip || '', d.sekolah || '', d.jenis_ptk || '', d.jabatan || '',
      d.pendidikan || '', d.status_kepegawaian || d.status || '', d.tugas_tambahan || '',
      d.tanggal_lahir || '', d.hp || d.telepon || '', d.email || '', d.alamat || '',
      d.tmt || '', d.sertifikasi || '', '',
    ]);

    // Baca sekolah dari static JSON
    const sekolahList = loadJson('data-sekolah.json');
    const schoolRows: any[][] = sekolahList.map((d: any) => [
      d.id || '', d.name || d.nama || '', d.npsn || '', d.jenjang || '',
      d.status || '', d.alamat || '', d.desa || '',
      d.kepalaSekolah || '', d.kontak || '', d.akreditasi || '',
    ]);

    const laporanRows: any[][] = [];
    const beritaRows: any[][] = [];
    const galeriRows: any[][] = [];

    await syncSheetData(sheets, spreadsheet.id, 'Data Siswa', 0, [
      'NIK', 'Nama', 'JK', 'NISN', 'Sekolah', 'Jenjang', 'Kelas', 'Desa', 'Status',
      'Tgl Lahir', 'Tempat Lahir', 'Alamat', 'HP', 'Ayah', 'Ibu', 'Pekerjaan Ayah',
      'Pekerjaan Ibu', 'KIP', 'No KIP', 'Tgl Input',
    ], studentRows, 20);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheet.id,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: 'Data Pegawai', gridProperties: { rowCount: Math.max(1000, empRows.length + 10) } },
          },
        }],
      },
    });
    await syncSheetData(sheets, spreadsheet.id, 'Data Pegawai', 1, [
      'NIK', 'Nama', 'JK', 'NUPTK', 'NIP', 'Sekolah', 'Jenis PTK', 'Jabatan',
      'Pendidikan', 'Status', 'Tugas Tambahan', 'Tgl Lahir', 'HP', 'Email',
      'Alamat', 'TMT', 'Sertifikasi', 'Tgl Input',
    ], empRows, 18);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheet.id,
      requestBody: {
        requests: [
          { addSheet: { properties: { title: 'Data Sekolah', gridProperties: { rowCount: Math.max(1000, schoolRows.length + 10) } } } },
          { addSheet: { properties: { title: 'Laporan Bulanan', gridProperties: { rowCount: Math.max(1000, laporanRows.length + 10) } } } },
          { addSheet: { properties: { title: 'Berita', gridProperties: { rowCount: Math.max(1000, beritaRows.length + 10) } } } },
          { addSheet: { properties: { title: 'Galeri', gridProperties: { rowCount: Math.max(1000, galeriRows.length + 10) } } } },
        ],
      },
    });

    await syncSheetData(sheets, spreadsheet.id, 'Data Sekolah', 2, [
      'ID', 'Nama', 'NPSN', 'Jenjang', 'Status', 'Alamat', 'Desa', 'Kepsek', 'Kontak', 'Akreditasi',
    ], schoolRows, 10);

    await syncSheetData(sheets, spreadsheet.id, 'Laporan Bulanan', 3, [
      'ID', 'Sekolah', 'Bulan', 'Tahun', 'Status', 'Tgl Kirim', 'Dikirim Oleh',
    ], laporanRows, 7);

    await syncSheetData(sheets, spreadsheet.id, 'Berita', 4, [
      'ID', 'Judul', 'Sekolah', 'Kategori', 'Tanggal', 'Penulis', 'Status',
    ], beritaRows, 7);

    await syncSheetData(sheets, spreadsheet.id, 'Galeri', 5, [
      'ID', 'Judul', 'Kategori', 'Sekolah', 'URL', 'Tgl Upload',
    ], galeriRows, 6);

    return NextResponse.json({
      success: true,
      spreadsheetUrl: spreadsheet.url,
      counts: { siswa: studentRows.length, pegawai: empRows.length, sekolah: schoolRows.length, laporan: laporanRows.length, berita: beritaRows.length, galeri: galeriRows.length },
    });
  } catch (error: any) {
    console.error('[cron] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
