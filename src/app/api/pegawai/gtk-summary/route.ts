import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';

let dataCache: any[] | null = null;
let pltCache: any[] | null = null;

function loadStaticData() {
  if (dataCache) return dataCache;
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  const raw = fs.readFileSync(p, 'utf-8');
  dataCache = JSON.parse(raw);
  return dataCache;
}

function loadPltData() {
  if (pltCache) return pltCache;
  try {
    const p = path.join(process.cwd(), 'src', 'data', 'data-plt.json');
    const raw = fs.readFileSync(p, 'utf-8');
    pltCache = JSON.parse(raw);
  } catch {
    pltCache = [];
  }
  return pltCache;
}

interface SchoolGtk {
  name: string;
  teachers: number;
  staff: number;
  total: number;
  certified: number;
  headmaster: string;
  teachers_l: number;
  teachers_p: number;
  staff_l: number;
  staff_p: number;
  l: number;
  p: number;
}

async function loadFromFirestore(): Promise<any[]> {
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

async function loadTambahan(): Promise<any[]> {
  if (!isFirebaseAdminConfigured || !adminDb) return [];
  try {
    const snap = await adminDb.collection('pegawai_tambahan').get();
    const items: any[] = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));
    return items;
  } catch {
    return [];
  }
}

async function loadAllData(): Promise<any[]> {
  const employees = await loadFromFirestore();
  if (employees.length > 0) {
    const tambahan = await loadTambahan();
    return [...employees, ...tambahan];
  }
  const [staticData, tambahanData] = await Promise.all([loadStaticData(), loadTambahan()]);
  return [...staticData, ...tambahanData];
}

export async function GET() {
  const merged = await loadAllData();
  
  // Return actual data with our fix for sertifikasi
  const schools: Record<string, SchoolGtk> = {};

  for (const p of merged) {
    if (!p.sekolah) continue;
    const name = p.sekolah;
    if (!schools[name]) {
      schools[name] = {
        name, teachers: 0, staff: 0, total: 0, certified: 0,
        headmaster: '', teachers_l: 0, teachers_p: 0,
        staff_l: 0, staff_p: 0,
      };
    }
    const s = schools[name];
    const isGuru = p.jenis_ptk === 'Guru';
    const isStaff = p.jenis_ptk === 'Tenaga Kependidikan' || p.jenis_ptk === 'Kepala Sekolah';

    if (isGuru) {
      s.teachers++;
      if (p.jk === 'L') s.teachers_l++; else s.teachers_p++;
      // All teachers are considered certified as per user confirmation
      s.certified++;
    } else if (isStaff) {
      s.staff++;
      if (p.jk === 'L') s.staff_l++; else s.staff_p++;
    }

    s.total++;
    if (p.jenis_ptk === 'Kepala Sekolah' || p.tugas_tambahan === 'Kepala Sekolah') {
      s.headmaster = p.nama;
    }
  }

  // Apply PLT for schools without headmaster
  const pltList = loadPltData();
  for (const plt of pltList) {
    if (schools[plt.sekolah] && !schools[plt.sekolah].headmaster) {
      schools[plt.sekolah].headmaster = `plt. ${plt.plt_nama}`;
    }
  }

  // Compute l and p for each school
  const result = Object.values(schools).map(school => {
    school.l = school.teachers_l + school.staff_l;
    school.p = school.teachers_p + school.staff_p;
    return school;
  }).sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ schools: result });
}