import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRows } from '@/lib/googleSheets';
import { getCanonicalSchoolName, getNpsnBySchool } from '@/lib/normalize';
import fs from 'fs';
import path from 'path';

function normalizeRecord(d: any) {
  if (d.sekolah) d.sekolah = getCanonicalSchoolName(d.sekolah);
  if (!d.npsn && d.sekolah) d.npsn = getNpsnBySchool(d.sekolah);
  return d;
}

function mapSheetRow(r: Record<string, string>): any {
  return {
    nik: r.nik || '',
    nama: r.nama || '',
    nuptk: r.nuptk || '',
    jk: r.jk || '',
    tempat_lahir: r.tempat_lahir || '',
    tanggal_lahir: r.tanggal_lahir || '',
    nip: r.nip || '',
    status_kepegawaian: r.status_kepegawaian || '',
    jenis_ptk: r.jenis_ptk || '',
    agama: r.agama || '',
    tugas_tambahan: r.tugas_tambahan || '',
    sertifikasi: r.sertifikasi || '',
    tmt: r.tmt || '',
    sekolah: r.sekolah || '',
    role: r.role || '',
    dapodik: r.dapodik || '',
    aktif: r.aktif || '',
    mapel: r.mapel || '',
    kategori_guru: r.kategori_guru || r.kategoriguru || '',
  };
}

function loadFromStatic() {
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
  let result = raw.map((d: any, i: number) => normalizeRecord({ id: d.nik || `pegawai_${i}`, ...d }));

  const tkPath = path.join(process.cwd(), 'src', 'data', 'data-pegawai-tk.json');
  if (fs.existsSync(tkPath)) {
    const tkRaw = JSON.parse(fs.readFileSync(tkPath, 'utf-8'));
    const tkMapped = tkRaw.map((d: any, i: number) => normalizeRecord({ id: d.nik || `pegawai_tk_${i}`, ...d }));
    result = [...result, ...tkMapped];
  }

  return result;
}

function unionByNik(base: any[], override: any[]): any[] {
  const map = new Map<string, any>();
  for (const r of base) {
    map.set(r.nik || r.id, r);
  }
  for (const r of override) {
    const key = r.nik || r.id;
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      const merged = { ...existing };
      for (const [k, v] of Object.entries(r)) {
        if (v !== undefined && v !== null && v !== '') {
          (merged as any)[k] = v;
        }
      }
      merged._source = 'merged';
      map.set(key, merged);
    } else {
      map.set(key, { ...r, _source: 'override' });
    }
  }
  return [...map.values()];
}

function loadFromSupabase() {
  return supabaseAdmin
    ? supabaseAdmin.from('employees').select('*').then((result) => {
        if (result.data?.length) {
          return result.data.map(r => normalizeRecord(r));
        }
        return [];
      })
    : Promise.resolve([]);
}

function loadFromSheet(): Promise<any[]> {
  return getRows('data_pegawai')
    .then(rows => rows.length > 50 ? rows.map(mapSheetRow).map(normalizeRecord) : [])
    .catch(() => []);
}

const EXCLUDED_NIKS = new Set([
  '3209072108660002', // SANUSI
  '3209071304660003', // KARTONI
  '3209072302690002', // SOBANA
  '3209071603670001', // Aan Hamami
  '3209072908780003', // IMAN SUKIMAN
]);

export async function getAllPegawai() {
  const [sheetRecords, supabaseRecords] = await Promise.all([
    loadFromSheet(),
    loadFromSupabase(),
  ]);
  const staticRecords = loadFromStatic();

  let result = unionByNik(staticRecords, supabaseRecords);
  if (sheetRecords.length > 0) {
    result = unionByNik(result, sheetRecords);
  }

  return result.filter((d: any) => !EXCLUDED_NIKS.has(d.nik));
}

export async function getPegawaiByNik(nik: string) {
  const all = await getAllPegawai();
  return all.find((d: any) => d.nik === nik) || null;
}
