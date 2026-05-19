import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';

const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ROOT_ID || '1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ';

function getServiceAccount(): ServiceAccount | null {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
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

function getAuthClient() {
  const sa = getServiceAccount();
  if (!sa) return null;
  return new google.auth.GoogleAuth({
    credentials: sa,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

export async function POST() {
  const db = getAdminDb();
  const auth = getAuthClient();

  if (!db) {
    return NextResponse.json({ error: 'Firebase admin not configured' }, { status: 500 });
  }
  if (!auth) {
    return NextResponse.json({ error: 'Google auth failed' }, { status: 500 });
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Create spreadsheet in Drive folder
    const spreadsheetMetadata = {
      name: 'Data Siswa dan Pegawai - Portal Korwil',
      parents: [DRIVE_FOLDER_ID],
    };

    const fileRes = await drive.files.create({
      requestBody: {
        ...spreadsheetMetadata,
        mimeType: 'application/vnd.google-apps.spreadsheet',
      },
      fields: 'id, name, webViewLink',
    });

    const spreadsheetId = fileRes.data.id!;
    const spreadsheetUrl = fileRes.data.webViewLink!;

    // Make it accessible to anyone with the link
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    });

    // Fetch students from Firestore
    const studentsSnap = await db.collection('students').get();
    const studentRows: any[][] = [];
    studentsSnap.forEach(doc => {
      const d = doc.data();
      studentRows.push([
        d.nik || '',
        d.nama || '',
        d.jenis_kelamin || d.jk || '',
        d.nisn || '',
        d.schoolId || d.sekolah || '',
        d.jenjang || '',
        d.kelas || '',
        d.desa || '',
        d.status || 'aktif',
        d.tanggal_lahir || '',
        d.tempat_lahir || '',
        d.alamat || '',
        d.hp || d.telepon || '',
        d.nama_ayah || '',
        d.nama_ibu || '',
        d.pekerjaan_ayah || '',
        d.pekerjaan_ibu || '',
        d.penerima_kip || '',
        d.nomor_kip || '',
        d.createdAt ? new Date(d.createdAt.toMillis ? d.createdAt.toMillis() : d.createdAt).toLocaleDateString('id-ID') : '',
      ]);
    });

    // Fetch employees from Firestore
    const empSnap = await db.collection('employees').get();
    const empRows: any[][] = [];
    empSnap.forEach(doc => {
      const d = doc.data();
      empRows.push([
        d.nik || '',
        d.nama || '',
        d.jenis_kelamin || d.jk || '',
        d.nuptk || '',
        d.nip || '',
        d.schoolId || d.sekolah || '',
        d.jenis_ptk || '',
        d.jabatan || '',
        d.pendidikan || '',
        d.status_kepegawaian || d.status || '',
        d.tugas_tambahan || '',
        d.tanggal_lahir || '',
        d.hp || d.telepon || '',
        d.email || '',
        d.alamat || '',
        d.tmt || '',
        d.sertifikasi || '',
        d.createdAt ? new Date(d.createdAt.toMillis ? d.createdAt.toMillis() : d.createdAt).toLocaleDateString('id-ID') : '',
      ]);
    });

    // Create sheets with headers and data
    const requests: any[] = [
      // Rename first sheet to "Data Siswa"
      {
        updateSheetProperties: {
          properties: {
            sheetId: 0,
            title: 'Data Siswa',
            gridProperties: { rowCount: Math.max(1000, studentRows.length + 10) },
          },
          fields: 'title,gridProperties',
        },
      },
      // Add "Data Pegawai" sheet
      {
        addSheet: {
          properties: {
            title: 'Data Pegawai',
            gridProperties: { rowCount: Math.max(1000, empRows.length + 10) },
          },
        },
      },
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });

    // Write student data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Data Siswa!A:T',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            'NIK', 'Nama Lengkap', 'Jenis Kelamin', 'NISN', 'Sekolah',
            'Jenjang', 'Kelas', 'Desa', 'Status', 'Tanggal Lahir',
            'Tempat Lahir', 'Alamat', 'No HP', 'Nama Ayah', 'Nama Ibu',
            'Pekerjaan Ayah', 'Pekerjaan Ibu', 'Penerima KIP', 'No KIP', 'Tanggal Input'
          ],
          ...studentRows,
        ],
      },
    });

    // Write employee data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Data Pegawai!A:R',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            'NIK', 'Nama Lengkap', 'Jenis Kelamin', 'NUPTK', 'NIP',
            'Sekolah', 'Jenis PTK', 'Jabatan', 'Pendidikan', 'Status Kepegawaian',
            'Tugas Tambahan', 'Tanggal Lahir', 'No HP', 'Email', 'Alamat',
            'TMT', 'Sertifikasi', 'Tanggal Input'
          ],
          ...empRows,
        ],
      },
    });

    // Format headers (bold, background color)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 20,
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
            repeatCell: {
              range: {
                sheetId: 1,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 18,
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
          // Freeze header row for both sheets
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: { frozenRowCount: 1 },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: 1,
                gridProperties: { frozenRowCount: 1 },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      studentCount: studentRows.length,
      employeeCount: empRows.length,
      message: `Spreadsheet berhasil dibuat dengan ${studentRows.length} data siswa dan ${empRows.length} data pegawai`,
    });
  } catch (error: any) {
    console.error('[create-sheets] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
