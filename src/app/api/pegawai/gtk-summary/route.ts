import { NextResponse } from 'next/server';
import dataPegawai from '@/data/data-pegawai.json';
import dataPegawaiTk from '@/data/data-pegawai-tk.json';
import tkGelatikPegawai from '@/data/tk-gelatik-pegawai.json';
import pltData from '@/data/data-plt.json';
import { allSekolah } from '@/data/sekolah';
import { getAllPegawai } from '@/services/pegawai.service';
import { getCanonicalSchoolName, getNpsnBySchool } from '@/lib/normalize';

const HARDCODED_SHEETS: { url: string; sekolah: string }[] = [
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR4PhpkeqQjr9cbHrEoGwgQW9CvqVBA1D0--o1ZhXv_OaBqNPddwAHs_PZCsgXP-g/pub?gid=296347908&single=true&output=csv', sekolah: 'SD NEGERI 1 ASEM' },
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThPc1fGt2M1KTJmm6X2eJvSEMQIIgNn8QBCtcwLQN9zGjc0TLZDJTwREBOYzX0qQ/pub?gid=430985553&single=true&output=csv', sekolah: 'SD NEGERI 1 ASEM' },
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtIJapNJgcZ2Z0GR83o916wOHGwt-W0KiQtaC0-mtvL8KpUVBOKWJCaD1TK8DMAA/pub?gid=1187748548&single=true&output=csv', sekolah: 'TK GELATIK' },
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjHBZ44HfzBKjyVdoUN_GsGGpCMKZqh7xygrVX8xal2AsCBrlQ02VH52PUfoRobA/pub?gid=1625950301&single=true&output=csv', sekolah: 'TK GELATIK' },
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vShSwUruSTzg53g2ICR74hjRI2lUkiFgDFrnWz4X4D1atV1bHP174t26Nc6C53_LQ/pub?gid=766555456&single=true&output=csv', sekolah: 'SD NEGERI 3 SIGONG' },
  { url: 'https://docs.google.com/spreadsheets/d/1KCVDeAwkeTFzKSd_t9d2rtV2gNLjEGY3/export?format=csv', sekolah: 'TK NEGERI LEMAHABANG' },
  { url: 'https://docs.google.com/spreadsheets/d/1-x_9YA0T3oZKDfu4fZLqFN886kaZHbuB/export?format=csv', sekolah: 'TK NEGERI LEMAHABANG' },
  { url: 'https://docs.google.com/spreadsheets/d/1HD28oILkZ5X-wZn7bSYNeWQgucS1cFVp/export?format=csv', sekolah: 'KB MUTIARA' },
  { url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ202X-T9rAo8Lq3x6WVGyJkPfd9x4q69CFFu-I16OHQ20KtmVRTCWxznuuFgLiyA/pub?gid=1329436018&single=true&output=csv', sekolah: 'KB MUTIARA' },
];

const SHEETS = (() => {
  try {
    const env = process.env.GTK_SHEET_URLS;
    if (env) {
      const parsed = JSON.parse(env) as { url: string; sekolah: string }[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return HARDCODED_SHEETS;
})();

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
  const sekolahName = getCanonicalSchoolName(sekolah);
  return {
    nik,
    nama: (cols[1] || '').trim(),
    nuptk: (cols[2] || '').trim(),
    npsn: getNpsnBySchool(sekolahName),
    jk: (cols[3] || '').trim(),
    status_kepegawaian: (cols[7] || '').trim(),
    jenis_ptk: (cols[8] || '').trim(),
    tugas_tambahan: (cols[20] || '').trim(),
    sekolah: sekolahName,
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
    npsn: r.npsn || getNpsnBySchool(r.sekolah),
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
  npsn: string;
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
  try {
    const sheetData = await loadFromSheets();
    const staticData = loadStaticData();
    const firestoreData = await getAllPegawai();
    const merged = unionAll(sheetData, unionAll(staticData, firestoreData));

    // Seed with all schools from master data (keyed by NPSN)
    const schools: Record<string, SchoolGtk> = {};
    for (const s of allSekolah) {
      const name = getCanonicalSchoolName(s.nama);
      schools[s.npsn] = {
        npsn: s.npsn, name, teachers: 0, staff: 0, total: 0, certified: 0,
        headmaster: '', teachers_l: 0, teachers_p: 0,
        staff_l: 0, staff_p: 0, l: 0, p: 0,
      };
    }

    // Overlay GTK data from merged pegawai records
    for (const p of merged) {
      if (!p.sekolah) continue;
      const npsn = p.npsn || getNpsnBySchool(p.sekolah);
      if (!npsn || !schools[npsn]) continue;
      const s = schools[npsn];
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

    // PLT fallback – lookup by canonical name
    for (const plt of pltData) {
      const pltSchool = getCanonicalSchoolName(plt.sekolah);
      const npsn = getNpsnBySchool(pltSchool);
      if (npsn && schools[npsn] && !schools[npsn].headmaster) {
        schools[npsn].headmaster = `plt. ${plt.plt_nama}`;
      }
    }

    const result = Object.values(schools).map(school => {
      school.l = school.teachers_l + school.staff_l;
      school.p = school.teachers_p + school.staff_p;
      return school;
    }).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ schools: result, total: result.length });
  } catch (error: any) {
    console.error('GTK Summary error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat data GTK' }, { status: 500 });
  }
}
