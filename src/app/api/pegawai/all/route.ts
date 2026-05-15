import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';

let dataCache: any[] | null = null;

function loadStaticData() {
  if (dataCache) return dataCache;
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  const raw = fs.readFileSync(p, 'utf-8');
  dataCache = JSON.parse(raw);
  return dataCache;
}

function isPns(status: string): boolean {
  return status === 'PNS' || status === 'PPPK';
}

function getBupTimestamp(pegawai: any): number {
  if (!isPns(pegawai.status_kepegawaian)) return 9999999999999;
  if (!pegawai.tanggal_lahir) return 9999999999999;
  const parts = pegawai.tanggal_lahir.split('-');
  if (parts.length !== 3) return 9999999999999;
  const year = parseInt(parts[0], 10) + 60;
  const month = parseInt(parts[1], 10);
  return new Date(year, month, 1).getTime();
}

async function loadFromFirestore(): Promise<any[]> {
  if (!isFirebaseAdminConfigured || !adminDb) return [];
  try {
    const snap = await adminDb.collection('employees').get();
    const items: any[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return items;
  } catch {
    return [];
  }
}

async function loadTambahan(): Promise<any[]> {
  if (!isFirebaseAdminConfigured || !adminDb) return [];
  try {
    const snap = await adminDb.collection('pegawai_tambahan').get();
    const items: any[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return items;
  } catch {
    return [];
  }
}

async function loadAllData(): Promise<any[]> {
  const employees = await loadFromFirestore();
  // prefer Firestore employees as primary source
  if (employees.length > 0) {
    const tambahan = await loadTambahan();
    return [...employees, ...tambahan];
  }
  // fallback to static JSON + tambahan
  const [staticData, tambahanData] = await Promise.all([loadStaticData(), loadTambahan()]);
  return [...staticData, ...tambahanData];
}

export async function GET(req: NextRequest) {
  const merged = await loadAllData();

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '100', 10)));
  const search = req.nextUrl.searchParams.get('search')?.toLowerCase();

  const now = Date.now();

  let filtered = merged.filter((s: any) => {
    if (!isPns(s.status_kepegawaian)) return true;
    return getBupTimestamp(s) > now;
  });

  if (search) {
    filtered = filtered.filter(
      (s: any) =>
        s.nama?.toLowerCase().includes(search) ||
        s.nik?.includes(search) ||
        s.nip?.includes(search) ||
        s.nuptk?.toLowerCase().includes(search) ||
        s.sekolah?.toLowerCase().includes(search)
    );
  }

  filtered.sort((a: any, b: any) => getBupTimestamp(a) - getBupTimestamp(b));

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return NextResponse.json({
    items,
    page,
    limit,
    total,
    totalPages,
  });
}
