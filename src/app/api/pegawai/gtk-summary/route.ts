import { NextResponse } from 'next/server';
import dataPegawai from '@/data/data-pegawai.json';
import dataPegawaiTk from '@/data/data-pegawai-tk.json';
import tkGelatikPegawai from '@/data/tk-gelatik-pegawai.json';
import pltData from '@/data/data-plt.json';
import { allSekolah } from '@/data/sekolah';
import { getAllPegawai } from '@/services/pegawai.service';
import { getCanonicalSchoolName } from '@/lib/normalize';

const SHEETS = [
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4PhpkeqQjr9cbHrEoGwgQW9CvqVBA1D0--o1ZhXv_OaBqNPddwAHs_PZCsgXP-g/pub?gid=296347908&single=true&output=csv', sekolah: 'SD NEGERI 1 ASEM' },
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThPc1fGt2M1KTJmm6X2eJvSEMQIIgNn8QBCtcwLQN9zGjc0TLZDJTwREBOYzX0qQ/pub?gid=430985553&single=true&output=csv', sekolah: 'SD NEGERI 1 ASEM' },
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtIJapNJgcZ2Z0GR83o916wOHGwt-W0KiQtaC0-mtvL8KpUVBOKWJCaD1TK8DMAA/pub?gid=1187748548&single=true&output=csv', sekolah: 'TK GELATIK' },
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjHBZ44HfzBKjyVdoUN_GsGGpCMKZqh7xygrVX8xal2AsCBrlQ02VH52PUfoRobA/pub?gid=1625950301&single=true&output=csv', sekolah: 'TK GELATIK' },
];

let dataCache: any[] = [];
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function parseCSVLine(line: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function mapRow(cols: string[], sekolah: string) {
  const nik = (cols[44] || '').trim();
  if (!nik) return null;
  return {
    nik,
    nama: (cols[1] || '').trim(),
    nuptk: (cols[2] || '').trim(),
    jk: (cols[3] || '').trim(),
    status_kepegawaian: (cols[7] || '').trim(),
    jenis_ptk: (cols[8] || '').trim(),
    tugas_tambahan: (cols[20] || '').trim(),
    sekolah: getCanonicalSchoolName(sekolah),
  };
}

async function fetchSheet(url: string, sekolah: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 5) return [];
    const records: any[] = [];
    for (const row of lines.slice(5)) {
      const cols = parseCSVLine(row);
      if (cols.length < 5) continue;
      const record = mapRow(cols, sekolah);
      if (record) records.push(record);
    }
    return records;
  } catch {
    return [];
  }
}

async function loadFromSheets() {
  const now = Date.now();
  if (dataCache.length > 0 && now - cacheTime < CACHE_TTL) return dataCache;

  const all: any[] = [];
  for (const sheet of SHEETS) {
    const records = await fetchSheet(sheet.url, sheet.sekolah);
    all.push(...records);
  }
  dataCache = all;
  cacheTime = now;
  return all;
}

function loadStaticData() {
  return [...dataPegawai, ...dataPegawaiTk, ...tkGelatikPegawai].map(r => ({
    ...r,
    sekolah: r.sekolah ? getCanonicalSchoolName(r.sekolah) : r.sekolah,
  }));
}

function unionAll(sheetRecords: any[], staticRecords: any[]): any[] {
  const map = new Map<string, any>();
  for (const r of staticRecords) {
    map.set(r.nik || r.id, { ...r, _source: 'static' });
  }
  for (const r of sheetRecords) {
    const key = r.nik || r.id;
    if (map.has(key)) {
      map.set(key, { ...map.get(key), ...r, _source: 'merged' });
    } else {
      map.set(key, { ...r, _source: 'sheet' });
    }
  }
  return [...map.values()];
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

export async function GET() {
  const sheetData = await loadFromSheets();
  const staticData = loadStaticData();
  const firestoreData = await getAllPegawai();
  const merged = unionAll(sheetData, unionAll(staticData, firestoreData));

  // Seed with all schools from master data (so zero-GTK schools still appear)
  const schools: Record<string, SchoolGtk> = {};
  for (const s of allSekolah) {
    const name = getCanonicalSchoolName(s.nama);
    schools[name] = {
      name, teachers: 0, staff: 0, total: 0, certified: 0,
      headmaster: '', teachers_l: 0, teachers_p: 0,
      staff_l: 0, staff_p: 0, l: 0, p: 0,
    };
  }

  // Overlay GTK data from merged pegawai records
  for (const p of merged) {
    if (!p.sekolah) continue;
    const name = getCanonicalSchoolName(p.sekolah);
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

  for (const plt of pltData) {
    const pltSchool = getCanonicalSchoolName(plt.sekolah);
    if (schools[pltSchool] && !schools[pltSchool].headmaster) {
      schools[pltSchool].headmaster = `plt. ${plt.plt_nama}`;
    }
  }

  const result = Object.values(schools).map(school => {
    school.l = school.teachers_l + school.staff_l;
    school.p = school.teachers_p + school.staff_p;
    return school;
  }).sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ schools: result });
}
