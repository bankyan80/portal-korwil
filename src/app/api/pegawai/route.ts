import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

function loadSA(): any {
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
  return null;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nik, nama, sekolah } = body;
    if (!nik || !nama) {
      return NextResponse.json({ error: 'NIK dan Nama wajib diisi' }, { status: 400 });
    }

    const creds = loadSA();
    if (!creds || !SHEET_ID) {
      return NextResponse.json({ error: 'Sheets tidak dikonfigurasi' }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth });

    // Get headers
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: 'data_pegawai!1:1',
    });
    const headers = (headerRes.data.values?.[0] || []).map(normalizeHeader);

    // Build row
    const row = headers.map(h => {
      const val = body[h];
      return val !== undefined && val !== null ? String(val) : '';
    });

    // Check if NIK already exists
    const existingRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: 'data_pegawai!A:Z',
    });
    const values = existingRes.data.values || [];
    if (values.length >= 2) {
      const nikCol = headers.findIndex(h => h.includes('nik'));
      if (nikCol >= 0) {
        const dup = values.findIndex((r, i) => i > 0 && r[nikCol]?.toString().trim() === nik);
        if (dup >= 0) {
          // Update existing row
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID, range: `data_pegawai!A${dup + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] },
          });
          return NextResponse.json({ success: true, action: 'updated' });
        }
      }
    }

    // Append new row
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: 'data_pegawai!A:A',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return NextResponse.json({ success: true, action: 'created' });
  } catch (error) {
    console.error('[POST /api/pegawai] Error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan data' }, { status: 500 });
  }
}
