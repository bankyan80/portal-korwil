import { NextRequest, NextResponse } from 'next/server';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1DpFCTLvRnfSw2asb8DZNY2TglveUsmYK_oJBZAPHwow/export?format=csv';

const DOC_FIELDS = [
  'IJAZAH TERAKHIR',
  'SK PPPK',
  'SK KGB',
  'KARPEG/KARTU VIRTUAL ASN',
  'KARIS/KARSU',
  'KTP',
  'KARTU KELUARGA',
  'KARTU/AKTA NIKAH',
  'SURAT TUGAS (MUTASI)',
  'SERTIFIKAT PENDIDIK (GURU)',
  'SK KEPALA SEKOLAH (SKBM)',
  'DOKUMEN LAINNYA',
] as const;

function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuote = false;
  for (const ch of text) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === '\n' && !inQuote) { lines.push(current); current = ''; continue; }
    if (ch === '\r') continue;
    current += ch;
  }
  if (current) lines.push(current);

  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const result: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals: string[] = [];
    let field = '';
    let q = false;
    for (const ch of lines[i]) {
      if (ch === '"') { q = !q; continue; }
      if (ch === ',' && !q) { vals.push(field.trim()); field = ''; continue; }
      field += ch;
    }
    vals.push(field.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
    result.push(row);
  }
  return result;
}

export async function GET(req: NextRequest) {
  const nip = req.nextUrl.searchParams.get('nip')?.replace(/\D/g, '') || '';

  try {
    const res = await fetch(SHEET_URL, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('Failed to fetch sheet');
    const csv = await res.text();
    const rows = parseCSV(csv);

    if (nip) {
      const match = rows.find(r => r['NIP']?.replace(/\D/g, '') === nip);
      if (!match) return NextResponse.json({ found: false, documents: [] });

      const documents = DOC_FIELDS
        .filter(f => match[f]?.startsWith('http'))
        .map(f => ({
          type: f,
          url: match[f],
        }));

      return NextResponse.json({
        found: true,
        nama: match['NAMA LENGKAP'],
        nip: match['NIP'],
        documents,
        total: DOC_FIELDS.length,
        uploaded: documents.length,
      });
    }

    const all = rows.map(r => {
      const docs = DOC_FIELDS.filter(f => r[f]?.startsWith('http'));
      return {
        nama: r['NAMA LENGKAP'],
        nip: r['NIP'],
        documents: docs.map(f => ({ type: f, url: r[f] })),
        uploaded: docs.length,
      };
    });

    return NextResponse.json({ found: true, count: rows.length, employees: all });
  } catch (e) {
    console.error('[dokumen/sheet] Error:', e);
    return NextResponse.json({ found: false, error: 'Gagal membaca data sheet' }, { status: 500 });
  }
}
