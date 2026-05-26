import { NextResponse } from 'next/server';
import { getRows } from '@/lib/googleSheets';
import { normalizeKelas } from '@/lib/normalize';
import fs from 'fs';
import path from 'path';

export interface PerKelasSekolah {
  name: string;
  jenjang: string;
  perKelas: Record<string, { l: number; p: number }>;
  totalL: number;
  totalP: number;
}

function loadStaticSiswa() {
  const p = path.join(process.cwd(), 'src', 'data', 'data-siswa.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function buildFromRawSiswa(siswa: any[]): PerKelasSekolah[] {
  const map = new Map<string, PerKelasSekolah>();

  for (const s of siswa) {
    const name = s.sekolah || s.nama_sekolah || '';
    const jenjang = s.jenjang || 'SD';
    if (!name) continue;
    const key = `${name}||${jenjang}`;
    if (!map.has(key)) {
      map.set(key, { name, jenjang, perKelas: {}, totalL: 0, totalP: 0 });
    }
    const entry = map.get(key)!;
    const rawKelas = (jenjang !== 'SD' && (s.rombel || s.nama_rombel)) ? (s.rombel || s.nama_rombel) : (s.kelas ? String(s.kelas) : (s.rombel || s.nama_rombel || '-'));
    const kelas = normalizeKelas(rawKelas, jenjang);
    if (!entry.perKelas[kelas]) entry.perKelas[kelas] = { l: 0, p: 0 };
    const jk = (s.jk || s.jenis_kelamin || 'L').substring(0, 1).toUpperCase();
    if (jk === 'L') { entry.perKelas[kelas].l++; entry.totalL++; }
    else { entry.perKelas[kelas].p++; entry.totalP++; }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildFromStatic(): PerKelasSekolah[] {
  return buildFromRawSiswa(loadStaticSiswa());
}

export async function GET() {
  // 1) Coba Google Sheets (primary)
  try {
    const rows = await getRows('data_siswa');
    if (rows.length > 200) {
      return NextResponse.json({ data: buildFromRawSiswa(rows), source: 'sheets' });
    }
  } catch (e) {
    console.log('[per-kelas] Sheets unavailable, fallback:', (e as Error).message);
  }

  // 2) Fallback: static JSON
  return NextResponse.json({ data: buildFromStatic(), source: 'static' });
}
