import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';

function loadData(): any[] {
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Database tidak dikonfigurasi' },
      { status: 500 }
    );
  }

  const token = request.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  try {
    const allData = loadData();
    if (allData.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada data pegawai' });
    }

    const records = allData.map((pegawai: any) => ({
      nik: pegawai.nik || pegawai.nuptk || `${pegawai.sekolah}_${pegawai.nama}`,
      ...pegawai,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('employees')
      .upsert(records, { onConflict: 'nik' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan ${records.length} pegawai ke database`,
      count: records.length,
    });
  } catch (error) {
    console.error('Error syncing pegawai:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyinkronkan data pegawai' },
      { status: 500 }
    );
  }
}
