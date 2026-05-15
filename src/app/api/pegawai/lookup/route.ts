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

async function loadAllFromFirestore(): Promise<any[]> {
  if (!isFirebaseAdminConfigured || !adminDb) return [];
  try {
    const snap = await adminDb.collection('employees').get();
    const items: any[] = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    return items;
  } catch {
    return [];
  }
}

async function loadAllData(): Promise<any[]> {
  const employees = await loadAllFromFirestore();
  if (employees.length > 0) return employees;
  return loadStaticData();
}

export async function GET(req: NextRequest) {
  const nik = req.nextUrl.searchParams.get('nik')?.replace(/\D/g, '');
  const nip = req.nextUrl.searchParams.get('nip')?.replace(/\D/g, '');
  const search = req.nextUrl.searchParams.get('search')?.toLowerCase();
  const sekolah = req.nextUrl.searchParams.get('sekolah');

  const all = await loadAllData();

  if (nik) {
    const match = all.find((s: any) => s.nik === nik);
    if (!match) {
      return NextResponse.json({ found: false, message: 'NIK tidak ditemukan' });
    }
    return NextResponse.json({ found: true, pegawai: match });
  }

  if (nip) {
    const match = all.find((s: any) => s.nip === nip);
    if (!match) {
      return NextResponse.json({ found: false, message: 'NIP tidak ditemukan' });
    }
    return NextResponse.json({ found: true, pegawai: match });
  }

  if (search) {
    const results = all.filter(
      (s: any) =>
        s.nama?.toLowerCase().includes(search) ||
        s.nik?.includes(search) ||
        s.nip?.includes(search) ||
        s.nuptk?.toLowerCase().includes(search)
    );
    return NextResponse.json({ found: results.length > 0, results: results.slice(0, 50) });
  }

  if (sekolah) {
    const results = all.filter((s: any) => s.sekolah?.toLowerCase().includes(sekolah.toLowerCase()));
    return NextResponse.json({ found: results.length > 0, results });
  }

  return NextResponse.json({ total: all.length });
}
