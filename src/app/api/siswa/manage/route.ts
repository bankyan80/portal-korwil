import { NextRequest, NextResponse } from 'next/server';
import { verifyCookieAuth } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';
import siswaData from '@/data/data-siswa.json';

const OVERLAY_PATH = path.join(process.cwd(), 'src', 'data', 'overlay-siswa.json');

function readOverlay(): any[] {
  try {
    if (!fs.existsSync(OVERLAY_PATH)) return [];
    return JSON.parse(fs.readFileSync(OVERLAY_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeOverlay(data: any[]) {
  fs.writeFileSync(OVERLAY_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function getUserSchool(req: NextRequest): string | null {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
    const decoded = JSON.parse(atob(padded));
    return decoded.schoolName || decoded.school_name || null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;
  if (auth instanceof NextResponse && auth.status === 500) {
    const payload = token?.split('.')[1];
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userSchool = getUserSchool(req);
  const records = readOverlay();
  const filtered = userSchool
    ? records.filter((r: any) => r.sekolah === userSchool)
    : records;

  return NextResponse.json({ count: filtered.length, records: filtered });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  if (auth instanceof NextResponse && auth.status !== 500) return auth;
  if (auth instanceof NextResponse && auth.status === 500) {
    const payload = token?.split('.')[1];
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'upsert') {
      const record = body.record;
      if (!record || !record.nik) {
        return NextResponse.json({ error: 'Record dan NIK wajib diisi' }, { status: 400 });
      }
      const records = readOverlay();
      const idx = records.findIndex((r: any) => r.nik === record.nik);
      const merged = { ...record, updatedAt: new Date().toISOString() };
      if (idx >= 0) {
        records[idx] = merged;
      } else {
        merged.createdAt = new Date().toISOString();
        records.push(merged);
      }
      writeOverlay(records);
      return NextResponse.json({ success: true, record: merged });
    }

    if (action === 'delete') {
      const { nik } = body;
      if (!nik) return NextResponse.json({ error: 'NIK wajib diisi' }, { status: 400 });
      const records = readOverlay();
      const filtered = records.filter((r: any) => r.nik !== nik);
      writeOverlay(filtered);
      return NextResponse.json({ success: true, deleted: records.length - filtered.length });
    }

    if (action === 'promote') {
      const records = readOverlay();
      const overlayNiks = new Set(records.map((r: any) => r.nik));
      let updated = 0;

      // 1) Promote existing overlay records
      let promoted = records.map((r: any) => {
        if (r.jenjang === 'SD' && r.status !== 'lulus') {
          updated++;
          if (r.kelas >= 6) {
            return { ...r, status: 'lulus', alasan: `Lulus ${new Date().getFullYear()}`, updatedAt: new Date().toISOString() };
          }
          return { ...r, kelas: (r.kelas || 0) + 1, updatedAt: new Date().toISOString() };
        }
        return r;
      });

      // 2) Import kelas 6 from main DB that aren't yet in overlay
      const year = new Date().getFullYear();
      for (const s of siswaData as any[]) {
        if (overlayNiks.has(s.nik)) continue;
        const kelas = Number(s.kelas) || 0;
        if (s.jenjang === 'SD' && s.nik && kelas >= 6) {
          promoted.push({
            nik: s.nik, nama: s.nama, jk: s.jk, nisn: s.nisn || '',
            tanggal_lahir: s.tanggal_lahir || '', sekolah: s.sekolah || '',
            jenjang: 'SD', kelas: 6, desa: s.desa || '',
            status: 'lulus', alasan: `Lulus ${year}`,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          });
          updated++;
        }
      }

      writeOverlay(promoted);
      return NextResponse.json({ success: true, promoted: updated });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
