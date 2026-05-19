import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { getServiceAccount } from '@/lib/firebase-admin';

const SPREADSHEET_ID = '14v0ykMflGpnb-m-FbhG-GvNieMTFs_t_u3v4KOMxijQ';

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
    requestBody: {
      values: [headers, ...rows],
    },
  });
}

export async function POST() {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ error: 'Firebase admin not configured' }, { status: 500 });
  }

  const sheets = getSheetsClient();
  if (!sheets) {
    return NextResponse.json({ error: 'Google Sheets auth failed' }, { status: 500 });
  }

  try {
    // Sync Students
    const studentsSnap = await adminDb.collection('students').get();
    const studentRows: any[][] = [];
    studentsSnap.forEach(doc => {
      const d = doc.data();
      studentRows.push([
        d.nik || '', d.nama || '', d.jk || '', d.nisn || '',
        d.sekolah || '', d.jenjang || '', d.kelas || '', d.desa || '',
        d.status || 'aktif', d.alasan || '', d.tanggal_lahir || ''
      ]);
    });
    await syncSheet(sheets, 'Siswa!A:K', [
      'NIK', 'Nama', 'JK', 'NISN', 'Sekolah', 'Jenjang', 'Kelas', 'Desa', 'Status', 'Alasan', 'Tgl Lahir'
    ], studentRows);

    // Sync Employees
    const empSnap = await adminDb.collection('employees').get();
    const empRows: any[][] = [];
    empSnap.forEach(doc => {
      const d = doc.data();
      empRows.push([
        d.nik || '', d.nama || '', d.jk || '', d.nuptk || '', d.nip || '',
        d.sekolah || '', d.jenis_ptk || '', d.tugas_tambahan || '',
        d.status_kepegawaian || '', d.tanggal_lahir || ''
      ]);
    });
    await syncSheet(sheets, 'Pegawai!A:J', [
      'NIK', 'Nama', 'JK', 'NUPTK', 'NIP', 'Sekolah', 'Jenis PTK', 'Tugas Tambahan', 'Status Kepegawaian', 'Tgl Lahir'
    ], empRows);

    return NextResponse.json({
      success: true,
      students: studentRows.length,
      employees: empRows.length,
    });
  } catch (e: any) {
    console.error('Sync error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
