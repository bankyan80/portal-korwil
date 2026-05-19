import { NextResponse } from 'next/server';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';

const SEKOLAH = 'TK GELATIK';
const GURU_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtIJapNJgcZ2Z0GR83o916wOHGwt-W0KiQtaC0-mtvL8KpUVBOKWJCaD1TK8DMAA/pub?gid=1187748548&single=true&output=csv';
const TENDIK_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjHBZ44HfzBKjyVdoUN_GsGGpCMKZqh7xygrVX8xal2AsCBrlQ02VH52PUfoRobA/pub?gid=1625950301&single=true&output=csv';

function getServiceAccount(): ServiceAccount | null {
  const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!envVal) return null;
  try {
    return JSON.parse(envVal) as ServiceAccount;
  } catch {
    try {
      const decoded = Buffer.from(envVal, 'base64').toString('utf-8');
      return JSON.parse(decoded) as ServiceAccount;
    } catch {
      return null;
    }
  }
}

function getAdminDb() {
  const sa = getServiceAccount();
  if (!sa) return null;
  if (!getApps().length) {
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

const SEKOLAH = 'TK GELATIK';
const GURU_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTtIJapNJgcZ2Z0GR83o916wOHGwt-W0KiQtaC0-mtvL8KpUVBOKWJCaD1TK8DMAA/pub?gid=1187748548&single=true&output=csv';
const TENDIK_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjHBZ44HfzBKjyVdoUN_GsGGpCMKZqh7xygrVX8xal2AsCBrlQ02VH52PUfoRobA/pub?gid=1625950301&single=true&output=csv';

function parseCSVLine(line: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function downloadCSV(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function mapRow(cols: string[], sekolah: string) {
  const nik = (cols[44] || '').trim();
  if (!nik) return null;
  return {
    nik,
    nama: (cols[1] || '').trim(),
    nuptk: (cols[2] || '').trim(),
    jk: (cols[3] || '').trim(),
    tempat_lahir: (cols[4] || '').trim(),
    tanggal_lahir: (cols[5] || '').trim(),
    nip: (cols[6] || '').trim(),
    status_kepegawaian: (cols[7] || '').trim(),
    jenis_ptk: (cols[8] || '').trim(),
    agama: (cols[9] || '').trim(),
    alamat: (cols[10] || '').trim(),
    rt: (cols[11] || '').trim(),
    rw: (cols[12] || '').trim(),
    dusun: (cols[13] || '').trim(),
    desa: (cols[14] || '').trim(),
    kecamatan: (cols[15] || '').trim(),
    kode_pos: (cols[16] || '').trim(),
    telepon: (cols[17] || '').trim(),
    hp: (cols[18] || '').trim(),
    email: (cols[19] || '').trim(),
    tugas_tambahan: (cols[20] || '').trim(),
    sk_cpns: (cols[21] || '').trim(),
    tanggal_cpns: (cols[22] || '').trim(),
    sk_pengangkatan: (cols[23] || '').trim(),
    tmt_pengangkatan: (cols[24] || '').trim(),
    lembaga_pengangkatan: (cols[25] || '').trim(),
    pangkat_golongan: (cols[26] || '').trim(),
    sumber_gaji: (cols[27] || '').trim(),
    nama_ibu_kandung: (cols[28] || '').trim(),
    status_perkawinan: (cols[29] || '').trim(),
    nama_suami_istri: (cols[30] || '').trim(),
    nip_suami_istri: (cols[31] || '').trim(),
    pekerjaan_suami_istri: (cols[32] || '').trim(),
    tmt_pns: (cols[33] || '').trim(),
    lisensi_kepala_sekolah: (cols[34] || '').trim(),
    pernah_diklat_kepengawasan: (cols[35] || '').trim(),
    keahlian_braille: (cols[36] || '').trim(),
    keahlian_bahasa_isyarat: (cols[37] || '').trim(),
    npwp: (cols[38] || '').trim(),
    nama_wajib_pajak: (cols[39] || '').trim(),
    kewarganegaraan: (cols[40] || '').trim(),
    bank: (cols[41] || '').trim(),
    nomor_rekening: (cols[42] || '').trim(),
    rekening_atas_nama: (cols[43] || '').trim(),
    no_kk: (cols[45] || '').trim(),
    karpeg: (cols[46] || '').trim(),
    karis_karsu: (cols[47] || '').trim(),
    lintang: (cols[48] || '').trim(),
    bujur: (cols[49] || '').trim(),
    nuks: (cols[50] || '').trim(),
    sekolah,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

async function importCSV(url: string, label: string) {
  const csvText = await downloadCSV(url);
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 5) return { success: 0, errors: [] };
  const dataRows = lines.slice(5);
  let success = 0;
  const errors: string[] = [];
  for (const row of dataRows) {
    try {
      const cols = parseCSVLine(row);
      if (cols.length < 5) continue;
      const record = mapRow(cols, SEKOLAH);
      if (!record) { errors.push('NIK kosong'); continue; }
      await db.collection('employees').doc(record.nik).set(record, { merge: true });
      success++;
    } catch (e: any) {
      errors.push(e.message);
    }
  }
  return { success, errors };
}

export async function POST() {
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: 'Firebase admin not configured' }, { status: 500 });
  }

  try {
    // Step 1: Delete all existing TK GELATIK records
    const snap = await db.collection('employees').where('sekolah', '==', SEKOLAH).get();
    let deleted = 0;
    const batch = db.batch();
    snap.forEach(docSnap => {
      batch.delete(docSnap.ref);
      deleted++;
    });
    if (deleted > 0) await batch.commit();

    // Step 2: Import new data
    const guruResult = await importCSV(GURU_URL, 'Guru');
    const tendikResult = await importCSV(TENDIK_URL, 'Tenaga Kependidikan');

    return NextResponse.json({
      success: true,
      deleted,
      imported: guruResult.success + tendikResult.success,
      guru: guruResult.success,
      tendik: tendikResult.success,
      errors: [...guruResult.errors, ...tendikResult.errors],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
