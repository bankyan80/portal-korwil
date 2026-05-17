import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

function isPns(status: string): boolean {
  return status === 'PNS' || status === 'PPPK';
}

function getBupTimestamp(tanggalLahir: string): number {
  if (!tanggalLahir) return 9999999999999;
  const parts = tanggalLahir.split('-');
  if (parts.length !== 3) return 9999999999999;
  return new Date(parseInt(parts[0], 10) + 60, parseInt(parts[1], 10) - 1, 1).getTime();
}

function getBupDate(tanggalLahir: string): string {
  if (!tanggalLahir) return '-';
  const parts = tanggalLahir.split('-');
  if (parts.length !== 3) return '-';
  const year = parseInt(parts[0], 10) + 60;
  const month = parseInt(parts[1], 10);
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${months[month - 1] || ''} ${year}`;
}

function loadStaticData(): any[] {
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function loadFromFirestore(): Promise<any[]> {
  if (!isFirebaseAdminConfigured || !adminDb) return [];
  try {
    const snap = await adminDb.collection('employees').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
  if (forbidden) return forbidden;

  const nik = req.nextUrl.searchParams.get('nik');
  if (!nik) {
    return NextResponse.json({ found: false, error: 'Parameter NIK diperlukan' }, { status: 400 });
  }

  const cleanNik = nik.replace(/\D/g, '');

  const employees = await loadFromFirestore();
  const allData = employees.length > 0 ? employees : loadStaticData();

  const pegawai = allData.find((p: any) => p.nik === cleanNik);
  if (!pegawai) {
    return NextResponse.json({ found: false, error: 'Pegawai tidak ditemukan' });
  }

  const bupTimestamp = getBupTimestamp(pegawai.tanggal_lahir);
  const now = Date.now();
  const bupDate = getBupDate(pegawai.tanggal_lahir);

  const usia = pegawai.tanggal_lahir ? (() => {
    const parts = pegawai.tanggal_lahir.split('-');
    if (parts.length !== 3) return 0;
    const birth = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  })() : 0;

  const masaKerja = pegawai.tmt ? (() => {
    const parts = pegawai.tmt.split('-');
    if (parts.length !== 3) return 0;
    const start = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const today = new Date();
    let years = today.getFullYear() - start.getFullYear();
    const m = today.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < start.getDate())) years--;
    return years;
  })() : 0;

  const isBup = isPns(pegawai.status_kepegawaian) && bupTimestamp <= now;

  return NextResponse.json({
    found: true,
    pegawai: {
      ...pegawai,
      usia,
      masaKerja,
      bupDate,
      isBup,
      statusBup: isBup ? 'Sudah BUP' : (isPns(pegawai.status_kepegawaian) ? `BUP: ${bupDate}` : 'Non-PNS'),
    },
  });
}
