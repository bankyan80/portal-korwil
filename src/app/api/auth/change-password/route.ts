import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function getNpsnFromCookie(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]*)/);
  if (!match || !match[1].startsWith('npsn:')) return null;

  const sessionId = match[1].split('npsn:')[1];
  if (!sessionId) return null;

  if (!isSupabaseAdminConfigured() || !supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from('app_data')
    .select('data')
    .eq('collection', 'npsn_sessions')
    .eq('id', sessionId)
    .single();

  if (!data) return null;
  const session = data.data as Record<string, any>;
  return session.npsn || null;
}

export async function POST(req: Request) {
  try {
    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    if (oldPassword === newPassword) {
      return NextResponse.json({ error: 'Password baru harus berbeda dari password lama' }, { status: 400 });
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

    const npsn = await getNpsnFromCookie(req);
    if (!npsn) {
      return NextResponse.json({ error: 'Sesi tidak valid. Silakan login ulang.' }, { status: 401 });
    }

    const { data: cred } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'school_passwords')
      .eq('id', npsn)
      .single();

    if (!cred) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 });
    }

    const credData = cred.data as Record<string, any>;
    if (credData.passwordHash !== hashPassword(oldPassword)) {
      return NextResponse.json({ error: 'Password lama salah' }, { status: 401 });
    }

    credData.passwordHash = hashPassword(newPassword);
    credData.updatedAt = Date.now();

    await supabaseAdmin
      .from('app_data')
      .update({ data: credData })
      .eq('id', npsn)
      .eq('collection', 'school_passwords');

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Change password error:', e);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
