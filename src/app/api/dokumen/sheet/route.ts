import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(req: NextRequest) {
  const nip = req.nextUrl.searchParams.get('nip')?.replace(/\D/g, '') || '';
  const nik = req.nextUrl.searchParams.get('nik')?.replace(/\D/g, '') || '';
  const nama = req.nextUrl.searchParams.get('nama')?.trim() || '';

  try {
    const results = await Promise.allSettled(
      SHEETS.map(sheet =>
        fetch(`https://docs.google.com/spreadsheets/d/${sheet.id}/export?format=csv`, {
          next: { revalidate: 300 },
        }).then(r => {
          if (!r.ok) throw new Error(`Sheet ${sheet.id}: ${r.status}`);
          return r.text();
        }).then(csv => ({ sheet, rows: parseCSV(csv) }))
      )
    );

    const allDocs: { type: string; url: string }[] = [];
    const seenKeys = new Set<string>();

    for (const result of results) {
      if (result.status !== 'fulfilled') {
        console.error('[dokumen/sheet] Error:', result.reason);
        continue;
      }
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
          allDocs.push({ type, url });
        }
      }
    }

    if (nip || nama) {
      return NextResponse.json({
        found: allDocs.length > 0,
        documents: allDocs,
        count: allDocs.length,
      });
    }

    return NextResponse.json({ found: true, documents: allDocs, count: allDocs.length });
  } catch (e) {
    console.error('[dokumen/sheet] Error:', e);
    return NextResponse.json({ found: false, error: 'Gagal membaca data sheet' }, { status: 500 });
  }
}
