import { NextRequest, NextResponse } from 'next/server';
import { getRows, appendRow, updateRow, deleteRow } from '@/lib/googleSheets';

type SheetName = 'data_pegawai' | 'data_siswa' | 'data_sekolah';

const SHEET_MAP: Record<string, SheetName> = {
  pegawai: 'data_pegawai',
  siswa: 'data_siswa',
  sekolah: 'data_sekolah',
};

function getSheet(req: NextRequest): SheetName {
  const path = req.nextUrl.pathname.split('/').pop() || '';
  const sheet = SHEET_MAP[path];
  if (!sheet) throw new Error(`Unknown sheet: ${path}`);
  return sheet;
}

export async function GET(req: NextRequest) {
  try {
    const data = await getRows(getSheet(req));
    return NextResponse.json({ success: true, data, total: data.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await appendRow(getSheet(req), body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { rowIndex, ...data } = await req.json();
    if (rowIndex === undefined) throw new Error('rowIndex required');
    await updateRow(getSheet(req), rowIndex, data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { rowIndex } = await req.json();
    if (rowIndex === undefined) throw new Error('rowIndex required');
    await deleteRow(getSheet(req), rowIndex);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
