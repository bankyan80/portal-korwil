import { google } from 'googleapis';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const SHEET_ID = '1m9AhXUZwOvqIl34606fX-Rf4HLjq15ht6n-nCVWHBb4';

function loadSA(): any {
  const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envKey && envKey !== '""') {
    try { return JSON.parse(envKey); } catch {}
    try { return JSON.parse(Buffer.from(envKey, 'base64').toString('utf-8')); } catch {}
  }
  const saDir = join(process.cwd(), 'service-account');
  if (existsSync(saDir)) {
    const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
    if (files.length) return JSON.parse(readFileSync(join(saDir, files[0]), 'utf8'));
  }
  throw new Error('Service account not found');
}

export async function GET() {
  try {
    const creds = loadSA();
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'simdawa!A:AK',
      majorDimension: 'ROWS',
    });

    const values = res.data.values || [];
    if (values.length < 2) {
      return Response.json({ success: true, updated_at: new Date().toISOString(), data: [] });
    }

    const headers = values[0];
    const rows = values.slice(1).filter((r: string[]) => r.some(c => String(c).trim()));

    const data = rows.map((row: string[]) => {
      const item: Record<string, any> = {};
      headers.forEach((h: string, i: number) => {
        item[String(h).trim()] = row[i] ?? '';
      });
      return item;
    });

    return Response.json({
      success: true,
      updated_at: new Date().toISOString(),
      data,
    });
  } catch (err: any) {
    return Response.json({
      success: false,
      message: err.message || 'Gagal membaca data SIMDAWA',
      updated_at: new Date().toISOString(),
      data: [],
    }, { status: 500 });
  }
}
