import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToDrive, getCategoryFolderId } from '@/lib/googleDrive';
import { getAuth } from 'firebase-admin/auth';
import { getServiceAccount } from '@/lib/firebase-admin';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { google } from 'googleapis';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';

function getFirebaseAdminAuth() {
  const sa = getServiceAccount();
  if (!sa) throw new Error('Firebase Admin not configured');
  if (!getApps().length) initializeApp({ credential: cert(sa) });
  return getAuth();
}

function loadServiceAccount(): any {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envVal && envVal !== '""') {
    try { return JSON.parse(envVal); } catch {}
    try { return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8')); } catch {}
  }
  const saDir = join(process.cwd(), 'service-account');
  if (existsSync(saDir)) {
    const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
    if (files.length) return JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
  }
  throw new Error('Service account tidak ditemukan');
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

/** Cari baris pegawai berdasarkan NIK, return (rowIndex, headers) */
async function findPegawaiByNIK(nik: string): Promise<{ rowIndex: number; headers: string[] } | null> {
  const creds = loadServiceAccount();
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'data_pegawai!A:Z',
    majorDimension: 'ROWS',
  });
  const values = res.data.values || [];
  if (values.length < 2) return null;

  const headers = values[0].map(normalizeHeader);
  const nikCol = headers.findIndex(h => h.includes('nik'));
  if (nikCol < 0) return null;

  const rowIndex = values.findIndex((row, i) => i > 0 && row[nikCol]?.toString().trim() === nik);
  if (rowIndex < 0) return null;

  return { rowIndex, headers };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getFirebaseAdminAuth();
    await adminAuth.verifyIdToken(token);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const nik = (formData.get('nik') as string || '').trim();

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    if (!nik) return NextResponse.json({ error: 'NIK wajib diisi' }, { status: 400 });

    // Upload file ke Drive
    const folderId = await getCategoryFolderId('dokumen');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const driveResult = await uploadFileToDrive(buffer, file.name, file.type, folderId, 'private');

    // Cari pegawai di Sheet dan update file_pdf_url
    if (SPREADSHEET_ID) {
      const found = await findPegawaiByNIK(nik);
      if (found) {
        const creds = loadServiceAccount();
        const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        const sheets = google.sheets({ version: 'v4', auth });

        const fileUrlCol = found.headers.findIndex(h => h.includes('file_pdf_url'));
        if (fileUrlCol >= 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `data_pegawai!${String.fromCharCode(65 + fileUrlCol)}${found.rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[driveResult.webViewLink]] },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...driveResult,
        nik,
      },
    });
  } catch (error) {
    console.error('[upload-pegawai] Error:', error);
    const message = error instanceof Error ? error.message : 'Upload gagal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
