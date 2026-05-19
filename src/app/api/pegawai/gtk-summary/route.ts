import { NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import dataPegawai from '@/data/data-pegawai.json';
import dataPegawaiTk from '@/data/data-pegawai-tk.json';
import tkGelatikPegawai from '@/data/tk-gelatik-pegawai.json';

let dataCache: any[] = [];
let pltCache: any[] = [];

function loadStaticData() {
  if (dataCache.length > 0) return dataCache;
  const data = [...dataPegawai, ...dataPegawaiTk, ...tkGelatikPegawai];
  dataCache = data;
  return dataCache;
}

import pltData from '@/data/data-plt.json';

function loadPltData() {
  if (pltCache.length > 0) return pltCache;
  pltCache = pltData;
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

function unionAll(firestoreRecords: any[], staticRecords: any[]): any[] {
  const map = new Map<string, any>();
  for (const r of staticRecords) {
    map.set(r.nik || r.id, { ...r, _source: 'static' });
  }
  for (const r of firestoreRecords) {
    const key = r.nik || r.id;
    if (map.has(key)) {
      map.set(key, { ...map.get(key), ...r, _source: 'merged' });
    } else {
      map.set(key, { ...r, _source: 'firestore' });
    }
  }
  return [...map.values()];
}

async function loadAllData(): Promise<any[]> {
  const firestoreData = await loadFromFirestore();
  const staticData = loadStaticData();
  const tambahanData = await loadTambahan();

  if (firestoreData.length > 0) {
    const merged = unionAll(firestoreData, staticData);
    return [...merged, ...tambahanData];
  }
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
        staff_l: 0, staff_p: 0, l: 0, p: 0,
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

  // Debug: log TK Gelatik details
  const tkGelatik = result.find(s => s.name === 'TK GELATIK');
  if (tkGelatik) {
    console.log('DEBUG TK GELATIK:', JSON.stringify(tkGelatik, null, 2));
    const tkGelatikRecords = merged.filter(p => p.sekolah === 'TK GELATIK');
    console.log('DEBUG TK GELATIK records count:', tkGelatikRecords.length);
    tkGelatikRecords.forEach((r, i) => {
      console.log(`  ${i + 1}. NIK: ${r.nik}, Nama: ${r.nama}, Jenis: ${r.jenis_ptk}, Source: ${r._source}`);
    });
  }

  return NextResponse.json({ schools: result });
}