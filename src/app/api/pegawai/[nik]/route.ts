import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import { normalizeSchool } from '@/lib/normalize';
import type { UserRole } from '@/types';

async function getEmployee(nik: string) {
  const { data } = await supabaseAdmin!
    .from('employees')
    .select('*')
    .eq('nik', nik)
    .single();
  return data;
}

async function upsertEmployee(nik: string, data: any) {
  const { error } = await supabaseAdmin!
    .from('employees')
    .upsert({ nik, ...data, updated_at: new Date().toISOString() }, { onConflict: 'nik' });
  if (error) throw error;
}

async function deleteEmployee(nik: string) {
  await supabaseAdmin!
    .from('employees')
    .delete()
    .eq('nik', nik);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ nik: string }> }
) {
  try {
    const cookieToken = req.cookies.get('auth-token')?.value;
    if (!cookieToken) {
      return NextResponse.json({ error: 'Unauthorized — tidak ada token' }, { status: 401 });
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

    const authResult = await verifyCookieAuth(cookieToken);
    if (authResult instanceof NextResponse) return authResult;

    const forbidden = requireRole(authResult as any, ['super_admin', 'operator_sekolah']);
    if (forbidden) return forbidden;

    const { nik } = await params;
    if (!nik) {
      return NextResponse.json({ error: 'NIK wajib diisi' }, { status: 400 });
    }

    const body = await req.json();
    const allowedKeys = [
      'nik', 'nama', 'jk', 'nuptk', 'nip', 'tanggal_lahir', 'tempat_lahir',
      'agama', 'alamat', 'rt', 'rw', 'dusun', 'desa', 'kecamatan', 'kode_pos',
      'telepon', 'hp', 'email', 'status_kepegawaian', 'jenis_ptk',
      'tugas_tambahan', 'sertifikasi', 'sekolah',
      'sk_cpns', 'tanggal_cpns', 'pangkat', 'golongan',
    ];
    const updateData: Record<string, any> = {};
    let renamedNik: string | null = null;
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        if (key === 'nik') {
          renamedNik = String(body[key]);
        } else {
          updateData[key] = body[key];
        }
      }
    }

    // operator_sekolah: only allow updating their own school's records
    if (authResult.role === 'operator_sekolah') {
      const docData = await getEmployee(nik);
      if (!docData) {
        return NextResponse.json({ error: 'Data pegawai tidak ditemukan' }, { status: 404 });
      }
      const actorSchool = (docData as Record<string, any>).sekolah || '';
      const operatorSchool = authResult.schoolName || '';
      if (!operatorSchool || normalizeSchool(actorSchool) !== normalizeSchool(operatorSchool)) {
        return NextResponse.json({ error: 'Forbidden — hanya bisa mengubah data sekolah sendiri' }, { status: 403 });
      }
    }

    const existing = await getEmployee(nik);
    if (!existing) {
      return NextResponse.json({ error: 'Data pegawai tidak ditemukan' }, { status: 404 });
    }

    await upsertEmployee(nik, updateData);

    // Sync ke Google Sheets
    try {
      const { google } = await import('googleapis');
      const { readFileSync, readdirSync, existsSync } = await import('fs');
      const { join } = await import('path');

      function loadSA() {
        const envVal = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (envVal && envVal !== '""') {
          try { return JSON.parse(envVal); } catch {}
          try { return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8')); } catch {}
        }
        const saDir = join(process.cwd(), 'service-account');
        if (existsSync(saDir)) {
          const files = readdirSync(saDir).filter(f => f.endsWith('.json'));
          if (files.length) return JSON.parse(readFileSync(join(saDir, files[0]), 'utf-8'));
        }
        return null;
      }

      const creds = loadSA();
      const sheetId = process.env.GOOGLE_SHEET_ID;
      if (creds && sheetId) {
        const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
        const sheets = google.sheets({ version: 'v4', auth });

        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'data_pegawai!A:Z',
          majorDimension: 'ROWS',
        });
        const values = res.data.values || [];
        if (values.length >= 2) {
          const headers = values[0].map((h: string) => h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
          const nikCol = headers.findIndex((h: string) => h.includes('nik'));
          if (nikCol >= 0) {
            const rowIdx = values.findIndex((row: string[], i: number) => i > 0 && row[nikCol]?.toString().trim() === nik);
            if (rowIdx >= 0) {
              const row = headers.map((h: string) => {
                if (h === 'updated_at') return new Date().toISOString();
                if (h === 'nik' && renamedNik) return renamedNik;
                return body[h] !== undefined ? String(body[h]) : (values[rowIdx][headers.indexOf(h)] || '');
              });
              await sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: `data_pegawai!A${rowIdx + 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [row] },
              });
            }
          }
        }
      }
    } catch (e) {
      console.log('[sync-to-sheets] non-fatal:', e);
    }

    // If NIK changed, copy to new record and delete old
    if (renamedNik && renamedNik !== nik) {
      const fullData = (await getEmployee(nik)) as Record<string, any> || {};
      await upsertEmployee(renamedNik, { ...fullData, nik: renamedNik });
      await deleteEmployee(nik);
    }

    return NextResponse.json({ success: true, message: 'Data pegawai berhasil diperbarui' });
  } catch (error) {
    console.error('Update pegawai error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Gagal memperbarui data pegawai', detail: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ nik: string }> }
) {
  try {
    const cookieToken = req.cookies.get('auth-token')?.value;
    if (!cookieToken) {
      return NextResponse.json({ error: 'Unauthorized — tidak ada token' }, { status: 401 });
    }

    const authResult = await verifyCookieAuth(cookieToken);
    if (authResult instanceof NextResponse) return authResult;

    const forbidden = requireRole(authResult as any, ['super_admin']);
    if (forbidden) return forbidden;

    const { nik } = await params;
    if (!nik) {
      return NextResponse.json({ error: 'NIK wajib diisi' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured() && supabaseAdmin) {
      const existing = await getEmployee(nik);
      if (existing) {
        await deleteEmployee(nik);
      }
    }

    return NextResponse.json({ success: true, message: 'Data pegawai berhasil dihapus' });
  } catch (error) {
    console.error('Delete pegawai error:', error);
    return NextResponse.json({ error: 'Gagal menghapus data pegawai' }, { status: 500 });
  }
}
