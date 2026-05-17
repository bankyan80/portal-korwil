import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import { parseCSVLine } from '@/lib/csv-parse';

function normalizeSchool(name: string): string {
  let n = name.toLowerCase().trim();
  n = n.replace(/^sdn\s+/i, 'sd negeri ');
  const prefixes = ['sd ', 'tk ', 'kb ', 'paud ', 'sps ', 'ra '];
  const suffixes = [' kecamatan lemahabang', ' kec. lemahabang', ' kabupaten cirebon'];
  for (const p of prefixes) { if (n.startsWith(p)) { n = n.slice(p.length); break; } }
  for (const s of suffixes) { if (n.endsWith(s)) { n = n.slice(0, -s.length); break; } }
  return n.trim();
}

function extractKelas(rombel: string): number | null {
  if (!rombel || typeof rombel !== 'string') return null;
  const m = rombel.match(/kelas\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseFloatSafe(v: string): number | null {
  if (!v || v.trim() === '' || v.trim() === '-' || v.trim() === '0') return null;
  const cleaned = v.trim().replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseIntSafe(v: string): number | null {
  if (!v || v.trim() === '' || v.trim() === '-') return null;
  const cleaned = v.trim().replace(',', '.');
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? null : n;
}

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json(
      { success: false, error: 'Firebase Admin tidak dikonfigurasi' },
      { status: 500 }
    );
  }

  // Verify auth
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  let csvUrl: string;
  try {
    const body = await req.json();
    csvUrl = body.csvUrl || '';
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body request tidak valid' },
      { status: 400 }
    );
  }

  if (!csvUrl) {
    return NextResponse.json(
      { success: false, error: 'URL CSV tidak disediakan' },
      { status: 400 }
    );
  }

  let csvText: string;
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    csvText = await res.text();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengunduh CSV: ' + (e as Error).message },
      { status: 502 }
    );
  }

  const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim());
  if (lines.length < 6) {
    return NextResponse.json(
      { success: false, error: 'CSV tidak memiliki cukup baris data' },
      { status: 400 }
    );
  }

  // Skip header rows:
  // Row 0: "Daftar Peserta Didik"
  // Row 1: School name -> extract sekolah name
  // Row 2: Address
  // Row 3: Download info
  // Row 4: Column headers
  // Row 5: Sub-headers (parent data headers)
  // Row 6+: Data

  const schoolLine = lines[1];
  const schoolParts = parseCSVLine(schoolLine);
  let sekolahName = schoolParts[0]?.trim() || '';

  // Extract just the school name before "KECAMATAN"
  const kecIndex = sekolahName.toUpperCase().indexOf('KECAMATAN');
  if (kecIndex > 0) {
    sekolahName = sekolahName.substring(0, kecIndex).trim();
  }

  if (!sekolahName) {
    return NextResponse.json(
      { success: false, error: 'Nama sekolah tidak ditemukan di CSV' },
      { status: 400 }
    );
  }

  const isSd = sekolahName.toLowerCase().includes('sd');
  const jenjang = isSd ? 'SD' : 'TK';

  const dataRows = lines.slice(6);
  const collection = adminDb.collection('students');
  let success = 0;
  let errors: string[] = [];

  for (const row of dataRows) {
    try {
      const cols = parseCSVLine(row);
      if (cols.length < 5) continue;

      const nik = cols[7]?.trim(); // NIK is column index 7
      if (!nik) { errors.push(`Baris ${success + errors.length + 1}: NIK kosong`); continue; }

      const dataAyah: Record<string, string> = {};
      const dataIbu: Record<string, string> = {};
      const dataWali: Record<string, string> = {};

      if (cols[24]?.trim()) dataAyah.nama = cols[24].trim();
      if (cols[25]?.trim()) dataAyah.tahun_lahir = cols[25].trim();
      if (cols[26]?.trim()) dataAyah.pendidikan = cols[26].trim();
      if (cols[27]?.trim()) dataAyah.pekerjaan = cols[27].trim();
      if (cols[28]?.trim()) dataAyah.penghasilan = cols[28].trim();
      if (cols[29]?.trim()) dataAyah.nik = cols[29].trim();

      if (cols[30]?.trim()) dataIbu.nama = cols[30].trim();
      if (cols[31]?.trim()) dataIbu.tahun_lahir = cols[31].trim();
      if (cols[32]?.trim()) dataIbu.pendidikan = cols[32].trim();
      if (cols[33]?.trim()) dataIbu.pekerjaan = cols[33].trim();
      if (cols[34]?.trim()) dataIbu.penghasilan = cols[34].trim();
      if (cols[35]?.trim()) dataIbu.nik = cols[35].trim();

      if (cols[36]?.trim()) dataWali.nama = cols[36].trim();
      if (cols[37]?.trim()) dataWali.tahun_lahir = cols[37].trim();
      if (cols[38]?.trim()) dataWali.pendidikan = cols[38].trim();
      if (cols[39]?.trim()) dataWali.pekerjaan = cols[39].trim();
      if (cols[40]?.trim()) dataWali.penghasilan = cols[40].trim();
      if (cols[41]?.trim()) dataWali.nik = cols[41].trim();

      const rombel = cols[42]?.trim() || '';
      const kelas = extractKelas(rombel);

      const lintang = parseFloatSafe(cols[58]?.trim() || '');
      const bujur = parseFloatSafe(cols[59]?.trim() || '');

      const studentData = {
        nik,
        nama: cols[1]?.trim() || '',
        nipd: cols[2]?.trim() || '',
        jk: cols[3]?.trim() || '',
        nisn: cols[4]?.trim() || '',
        tempat_lahir: cols[5]?.trim() || '',
        tanggal_lahir: cols[6]?.trim() || '',
        agama: cols[8]?.trim() || '',
        alamat: cols[9]?.trim() || '',
        rt: cols[10]?.trim() || '',
        rw: cols[11]?.trim() || '',
        dusun: cols[12]?.trim() || '',
        desa: cols[13]?.trim() || '',
        kecamatan: cols[14]?.trim() || '',
        kode_pos: cols[15]?.trim() || '',
        jenis_tinggal: cols[16]?.trim() || '',
        alat_transportasi: cols[17]?.trim() || '',
        telepon: cols[18]?.trim() || '',
        hp: cols[19]?.trim() || '',
        email: cols[20]?.trim() || '',
        skhun: cols[21]?.trim() || '',
        penerima_kps: cols[22]?.trim() || '',
        no_kps: cols[23]?.trim() || '',
        data_ayah: Object.keys(dataAyah).length > 0 ? dataAyah : null,
        data_ibu: Object.keys(dataIbu).length > 0 ? dataIbu : null,
        data_wali: Object.keys(dataWali).length > 0 ? dataWali : null,
        rombel,
        kelas,
        no_peserta_ujian: cols[43]?.trim() || '',
        no_seri_ijazah: cols[44]?.trim() || '',
        penerima_kip: cols[45]?.trim() || '',
        nomor_kip: cols[46]?.trim() || '',
        nama_di_kip: cols[47]?.trim() || '',
        nomor_kks: cols[48]?.trim() || '',
        no_reg_akta_lahir: cols[49]?.trim() || '',
        bank: cols[50]?.trim() || '',
        nomor_rekening: cols[51]?.trim() || '',
        rekening_atas_nama: cols[52]?.trim() || '',
        layak_pip: cols[53]?.trim() || '',
        alasan_layak_pip: cols[54]?.trim() || '',
        kebutuhan_khusus: cols[55]?.trim() || '',
        sekolah_asal: cols[56]?.trim() || '',
        anak_ke: parseIntSafe(cols[57]?.trim() || ''),
        lintang,
        bujur,
        no_kk: cols[60]?.trim() || '',
        berat_badan: parseIntSafe(cols[61]?.trim() || ''),
        tinggi_badan: parseIntSafe(cols[62]?.trim() || ''),
        lingkar_kepala: parseIntSafe(cols[63]?.trim() || ''),
        jumlah_saudara: parseIntSafe(cols[64]?.trim() || ''),
        jarak_rumah_km: parseFloatSafe(cols[65]?.trim() || ''),
        sekolah: sekolahName,
        jenjang,
      };

      await collection.doc(nik).set({
        ...studentData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      success++;
    } catch (e) {
      errors.push(`Baris ${success + errors.length + 1}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Berhasil mengimpor ${success} siswa dari ${success + errors.length} data`,
    school: sekolahName,
    total: success + errors.length,
    imported: success,
    errors: errors.length > 0 ? errors.slice(0, 10) : [],
  });
}
