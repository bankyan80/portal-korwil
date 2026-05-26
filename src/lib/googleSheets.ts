import { google } from 'googleapis';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
type SheetName = 'data_pegawai' | 'data_siswa' | 'data_sekolah';

/** Coba baca service account dari env var, lalu fallback ke file lokal */
function loadServiceAccount(): any {
  // Prioritas 1: GOOGLE_SERVICE_ACCOUNT_KEY (dedicated untuk Sheets)
  const sheetsKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (sheetsKey && sheetsKey !== '""') {
    try { return JSON.parse(sheetsKey); } catch {}
    try { return JSON.parse(Buffer.from(sheetsKey, 'base64').toString('utf-8')); } catch {}
  }
  // Prioritas 2: FIREBASE_SERVICE_ACCOUNT_KEY (legacy)
  const fbKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (fbKey && fbKey !== '""') {
    try { return JSON.parse(fbKey); } catch {}
    try { return JSON.parse(Buffer.from(fbKey, 'base64').toString('utf-8')); } catch {}
  }
  // Fallback: baca dari service-account/ folder
  const saDir = join(process.cwd(), 'service-account');
  if (existsSync(saDir)) {
    const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
    if (files.length) return JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
  }
  throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY / FIREBASE_SERVICE_ACCOUNT_KEY tidak ditemukan di env maupun file lokal');
}

let cachedAuth: any = null;
function getAuth() {
  if (cachedAuth) return cachedAuth;
  const creds = loadServiceAccount();
  cachedAuth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return cachedAuth;
}

let cachedClient: any = null;
function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = google.sheets({ version: 'v4', auth: getAuth() });
  return cachedClient;
}

async function getSheetId(name: SheetName): Promise<number> {
  const client = getClient();
  const res = await client.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties',
  });
  const sheet = res.data.sheets?.find(
    (s: any) => s.properties?.title?.toLowerCase().replace(/\s+/g, '_') === name
  );
  if (!sheet) throw new Error(`Sheet "${name}" tidak ditemukan`);
  return sheet.properties!.sheetId!;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function pick(data: Record<string, string>, headers: string[]): string[] {
  return headers.map(h => data[normalizeHeader(h)] || '');
}

export async function getRows(sheet: SheetName) {
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!A:Z`,
    majorDimension: 'ROWS',
  });
  const values = res.data.values || [];
  if (values.length < 2) return [];
  const headers = values[0].map(normalizeHeader);
  return values.slice(1).filter((r: string[]) => r.some(c => c.trim())).map((r: string[]) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = r[i] || ''; });
    return obj;
  });
}

export async function appendRow(sheet: SheetName, data: Record<string, string>) {
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!1:1`,
  });
  const headers = (res.data.values?.[0] || []).map(normalizeHeader);
  const row = pick(data, headers);
  await client.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!A:A`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
  return { success: true };
}

export async function updateRow(sheet: SheetName, rowIndex: number, data: Record<string, string>) {
  const client = getClient();
  const res = await client.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!1:1`,
  });
  const headers = (res.data.values?.[0] || []).map(normalizeHeader);
  const row = pick(data, headers);
  await client.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheet}!A${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
  return { success: true };
}

export async function deleteRow(sheet: SheetName, rowIndex: number) {
  const client = getClient();
  const sid = await getSheetId(sheet);
  await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: { sheetId: sid, dimension: 'ROWS', startIndex: rowIndex + 1, endIndex: rowIndex + 2 },
        },
      }],
    },
  });
  return { success: true };
}

export async function getSheetInfo() {
  const client = getClient();
  const res = await client.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties,spreadsheetUrl',
  });
  return res.data;
}
