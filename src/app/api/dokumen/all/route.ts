import { NextRequest, NextResponse } from 'next/server';
import { getAllPegawai } from '@/services/pegawai.service';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { google } from 'googleapis';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

type SheetConfig = {
  id: string;
  nipCol: string | null;
  nikCol?: string | null;
  nameCol: string;
  docCols: [string, string][];
};

const SHEETS: SheetConfig[] = [
  {
    id: '1DpFCTLvRnfSw2asb8DZNY2TglveUsmYK_oJBZAPHwow',
    nipCol: 'NIP',
    nameCol: 'NAMA LENGKAP',
    docCols: [
      ['IJAZAH TERAKHIR', 'IJAZAH TERAKHIR'],
      ['SK PPPK', 'SK PPPK'],
      ['SK KGB', 'SK KGB'],
      ['KARPEG', 'KARPEG/KARTU VIRTUAL ASN'],
      ['KARIS/KARSU', 'KARIS/KARSU'],
      ['KTP', 'KTP'],
      ['KARTU KELUARGA', 'KARTU KELUARGA'],
      ['AKTA NIKAH', 'KARTU/AKTA NIKAH'],
      ['SURAT TUGAS', 'SURAT TUGAS (MUTASI)'],
      ['SERTIFIKAT PENDIDIK', 'SERTIFIKAT PENDIDIK (GURU)'],
      ['SK KEPSEK', 'SK KEPALA SEKOLAH (SKBM)'],
      ['DOKUMEN LAIN', 'DOKUMEN LAINNYA'],
    ],
  },
  {
    id: '1m2U8kRg0homsTCWB_qMN-j3cn6UB6AcDxoVh5jjWdLE',
    nipCol: 'NIP',
    nameCol: 'NAMA LENGKAP (TANPA GELAR)',
    docCols: [
      ['IJAZAH', 'IJAZAH'],
      ['SK PPPK PW', 'SK PPPK PW'],
      ['KTP', 'KTP'],
      ['KARTU KELUARGA', 'KARTU KELUARGA'],
      ['NPWP', 'NPWP'],
      ['BPJS KESEHATAN', 'BPJS KESEHATAN'],
      ['SERTIFIKAT PENDIDIK', 'SERTIFIKAT PENDIDIK'],
      ['SK PENUGASAN KEPSEK', 'SK PENUGASAN (KEPSEK)'],
    ],
  },
  {
    id: '1kCqaWFolPToH-Y7c_wJd-HPJnwHG5x7vdHSbMfvbKqM',
    nipCol: null,
    nameCol: 'NAMA ASN PPPK',
    docCols: [
      ['FOTO ASN PPPK', 'UPLOAD FOTO (sesuai sample)'],
    ],
  },
  {
    id: '1MUAng-gw62IfrptbjndRx4cweHYJpgs-04vd792oAgI',
    nipCol: 'NIP',
    nikCol: null,
    nameCol: 'NAMA ASN (PNS)',
    docCols: [
      ['FOLDER DOKUMEN', 'LINK FOLDER (DRIVE)'],
    ],
  },
  {
    id: '1hbPqf3GM0A2FV8PclZHkS6o1XqavEhEhLi9ZKrJLBrg',
    nipCol: 'NIP',
    nikCol: 'NIK',
    nameCol: 'NAMA LENGKAP & GELAR',
    docCols: [
      ['SK CPNS', 'SCAN SK CPNS PDF (MAKS 1MB)'],
      ['SK PNS/P3K', 'SCAN SK PNS/P3K PDF (MAKS 1MB)'],
      ['IJAZAH + TRANSKRIP', 'SCAN IJAZAH+TRANSKRIP PDF (MAKS 1MB)'],
      ['SK PANGKAT', 'SCAN SK PANGKAT PDF (MAKS 1MB)'],
      ['SK JABATAN', 'SCAN SK JABATAN PDF (MAKS 2MB)'],
      ['IDENTITAS DIRI', 'IDENTITAS DIRI PDF (MAKS 2MB)'],
      ['DATA KELUARGA', 'DATA KELUARGA DIRI PDF (MAKS 2MB)'],
      ['DOKUMEN KOMPETENSI', 'DOKUMEN KOMPETENSI PDF (MAKS 2MB)'],
      ['SK KGB', 'SK KGB PDF (MAKS 1MB)'],
      ['SERTIFIKAT DIKLAT', 'SERTIFIKAT PELATIHAN/DIKLAT PDF (MAKS 2MB)'],
      ['SKP/DP3 2021', 'SKP/DP3 2021 PDF (MAKS 2MB)'],
      ['DOKUMEN LAINNYA', 'DOKUMEN LAINNYA PDF (MAKS 2MB)'],
      ['PAS FOTO', 'PASS FOTO (JPG/JPEG)'],
    ],
  },
];

function normalizeName(raw: string): string {
  return raw
    .replace(/,?\s*(S\.\w+|M\.\w+|A\.\w+|S[12])\b.*/gi, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

async function checkAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;
  const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
  if (forbidden) return forbidden;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuote = false;
  for (const ch of text) {
    if (ch === '\n' && !inQuote) { lines.push(current); current = ''; continue; }
    if (ch === '\r') continue;
    current += ch;
  }
  if (current) lines.push(current);
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]);
  const result: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
    result.push(row);
  }
  return result;
}

function splitLine(line: string): string[] {
  const vals: string[] = [];
  let field = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { vals.push(field.trim()); field = ''; continue; }
    field += ch;
  }
  vals.push(field.trim());
  return vals;
}

function isHttpUrl(v: string): boolean {
  return v.startsWith('http://') || v.startsWith('https://');
}

function getServiceAccount() {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!envVal) return null;
  try { return JSON.parse(envVal); } catch {}
  try { return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8')); } catch {}
  return null;
}

function inferDocType(filename: string): string {
  const upper = filename.toUpperCase();
  if (upper.includes('IJAZAH')) return 'IJAZAH + TRANSKRIP';
  if (upper.includes('SK PANGKAT') || upper.includes('SK IV') || upper.includes('SK III')) return 'SK PANGKAT';
  if (upper.includes('SK CPNS')) return 'SK CPNS';
  if (upper.includes('SK PPPK')) return 'SK PPPK';
  if (upper.includes('SK JABATAN') || upper.includes('JABFUNG')) return 'SK JABATAN';
  if (upper.includes('SK KEPSEK')) return 'SK KEPSEK';
  if (upper.includes('SK TERAKHIR')) return 'SK PANGKAT';
  if (upper.includes('PAK INTEGRASI') || upper.includes('PAK AKHIR') || upper.includes('PAK BARU')) return 'PAK';
  if (upper.includes('PAK')) return 'PAK';
  if (upper.includes('SERTIFIKAT PENDIDIK') || upper.includes('SERTIFIKAT')) return 'SERTIFIKAT PENDIDIK';
  if (upper.includes('JAFUNG')) return 'PAK';
  if (upper.includes('KARPEG')) return 'KARPEG';
  if (upper.includes('NPWP')) return 'NPWP';
  if (upper.includes('BPJS')) return 'BPJS KESEHATAN';
  if (upper.includes('KTP')) return 'KTP';
  if (upper.includes('KK') || upper.includes('KARTU KELUARGA')) return 'KARTU KELUARGA';
  if (upper.includes('FOTO')) return 'PAS FOTO';
  if (upper.includes('IJASAH')) return 'IJAZAH';
  return 'DOKUMEN DRIVE';
}

export async function GET(req: NextRequest) {
  const authErr = await checkAuth(req);
  if (authErr) return authErr;

  const nip = req.nextUrl.searchParams.get('nip')?.replace(/\D/g, '') || '';
  const nik = req.nextUrl.searchParams.get('nik')?.replace(/\D/g, '') || '';
  const nama = req.nextUrl.searchParams.get('nama')?.trim() || '';

  try {
    // 1. Fetch sheet documents
    const sheetResults = await Promise.allSettled(
      SHEETS.map(sheet =>
        fetch(`https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv`, {
          next: { revalidate: 300 },
        }).then(r => {
          if (!r.ok) throw new Error(`Sheet ${sheet.id}: ${r.status}`);
          return r.text();
        }).then(csv => ({ sheet, rows: parseCSV(csv) }))
      )
    );

    const allDocs: { type: string; url: string; source: string }[] = [];
    const seenKeys = new Set<string>();

    for (const result of sheetResults) {
      if (result.status !== 'fulfilled') continue;
      const { sheet, rows } = result.value;
      const normalizedNama = nama ? normalizeName(nama) : '';

      for (const row of rows) {
        let match = false;

        if (sheet.nipCol && nip) {
          const rowNip = (row[sheet.nipCol] || '').replace(/\D/g, '');
          if (rowNip === nip) match = true;
        }

        if (!match && sheet.nikCol && nik) {
          const rowNik = (row[sheet.nikCol] || '').replace(/\D/g, '');
          if (rowNik === nik) match = true;
        }

        if (!match && normalizedNama) {
          const rowName = normalizeName(row[sheet.nameCol] || '');
          if (rowName === normalizedNama) match = true;
        }

        if (!nip && !nik && !nama) match = true;
        if (!match) continue;

        for (const [type, col] of sheet.docCols) {
          const url = (row[col] || '').trim();
          if (!isHttpUrl(url)) continue;
          const key = `${type}::${url}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);
          allDocs.push({ type, url, source: 'form' });
        }
      }
    }

    // 2. Fetch Drive documents
    const pegawai = nip || nama ? await (async () => {
      const list = await getAllPegawai();
      if (nip) return list.find((p: any) => p.nip === nip);
      if (nama) {
        const q = normalizeName(nama);
        return list.find((p: any) => normalizeName(p.nama || '') === q)
          || list.find((p: any) => normalizeName(p.nama || '').includes(q));
      }
      return null;
    })() : null;

    if (pegawai) {
      const sekolahName: string = pegawai.sekolah || '';

      const { data: sekolahData } = await supabaseAdmin
        .from('app_data')
        .select('data')
        .eq('collection', 'schools')
        .filter('data->>name', 'ilike', `%${sekolahName}%`)
        .limit(1)
        .maybeSingle();

      const npsn = sekolahData?.data?.npsn || '';

      if (npsn) {
        const { data: mappingData } = await supabaseAdmin
          .from('app_data')
          .select('data')
          .eq('collection', 'drive_folders')
          .eq('id', npsn)
          .maybeSingle();

        let folderId: string | null = mappingData?.data?.folderId || null;

        if (folderId) {
          const sa = getServiceAccount();
          if (sa) {
            try {
              const auth = new google.auth.GoogleAuth({
                credentials: sa,
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
              });
              const drive = google.drive({ version: 'v3', auth });

              const allFolders: any[] = [];
              let pt: string | undefined;
              do {
                const r = await drive.files.list({
                  q: `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
                  fields: 'nextPageToken, files(id, name)',
                  pageSize: 100,
                  pageToken: pt,
                });
                allFolders.push(...(r.data.files || []));
                pt = r.data.nextPageToken || undefined;
              } while (pt);

              const pegawaiName = normalizeName(pegawai.nama || '');
              const matchedFolder = allFolders.find((f: any) => normalizeName(f.name || '') === pegawaiName)
                || allFolders.find((f: any) => normalizeName(f.name || '').includes(pegawaiName) || pegawaiName.includes(normalizeName(f.name || '')));

              if (matchedFolder) {
                const files: any[] = [];
                let fpt: string | undefined;
                do {
                  const r = await drive.files.list({
                    q: `'${matchedFolder.id}' in parents and trashed=false`,
                    fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink)',
                    pageSize: 100,
                    pageToken: fpt,
                  });
                  files.push(...(r.data.files || []));
                  fpt = r.data.nextPageToken || undefined;
                } while (fpt);

                for (const f of files) {
                  const type = inferDocType(f.name || '');
                  const key = `drive::${f.id}`;
                  if (seenKeys.has(key)) continue;
                  seenKeys.add(key);
                  allDocs.push({ type, url: f.webViewLink || '', source: 'drive' });
                }
              }
            } catch (e) {
              console.error('[dokumen/all] Drive error:', e);
            }
          }
        }
      }
    }

    return NextResponse.json({
      found: allDocs.length > 0,
      documents: allDocs,
      count: allDocs.length,
    });
  } catch (e) {
    console.error('[dokumen/all] Error:', e);
    return NextResponse.json({ found: false, error: 'Gagal membaca data' }, { status: 500 });
  }
}
