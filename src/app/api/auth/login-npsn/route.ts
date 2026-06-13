import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { adminAuth, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { allSekolah } from '@/data/sekolah';
import crypto from 'crypto';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: Request) {
  try {
    const { npsn, password } = await req.json();

    if (!npsn || !password) {
      return NextResponse.json({ error: 'NPSN dan password wajib diisi' }, { status: 400 });
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database tidak tersedia' }, { status: 500 });
    }

    const { data: cred } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'school_passwords')
      .eq('id', npsn)
      .single();

    let credData: Record<string, any>;

    if (!cred) {
      // Auto-seed: cari NPSN di data sekolah lokal, jika ada buat password default
      const school = allSekolah.find(s => s.npsn === npsn);
      if (!school) {
        return NextResponse.json({ error: 'NPSN tidak ditemukan. Hubungi administrator.' }, { status: 401 });
      }
      const now = Date.now();
      credData = {
        npsn: school.npsn,
        schoolName: school.nama,
        passwordHash: hashPassword('123456'),
        createdAt: now,
        updatedAt: now,
      };
      await supabaseAdmin
        .from('app_data')
        .upsert({ id: npsn, collection: 'school_passwords', data: credData });
    } else {
      credData = cred.data as Record<string, any>;
    }

    if (credData.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    const uid = `npsn-${npsn}`;
    const { data: existingProfile } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'users')
      .eq('id', uid)
      .single();

    let profile: Record<string, any>;
    const now = Date.now();

    if (existingProfile) {
      profile = (existingProfile.data as Record<string, any>) || {};
      profile.lastLogin = now;
      profile.updatedAt = now;
      profile.schoolId = profile.schoolId || npsn;
      profile.schoolName = profile.schoolName || credData.schoolName || '';
      await supabaseAdmin
        .from('app_data')
        .update({ data: profile })
        .eq('id', uid)
        .eq('collection', 'users');
    } else {
      profile = {
        uid,
        email: `operator-${npsn}@sch.id`,
        displayName: credData.schoolName || `Operator ${npsn}`,
        role: 'operator_sekolah',
        schoolId: npsn,
        schoolName: credData.schoolName || '',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
      };
      await supabaseAdmin
        .from('app_data')
        .upsert({ id: uid, collection: 'users', data: profile });
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = now + SESSION_DURATION_MS;

    await supabaseAdmin
      .from('app_data')
      .upsert({
        id: sessionId,
        collection: 'npsn_sessions',
        data: {
          uid,
          npsn,
          role: 'operator_sekolah',
          schoolId: npsn,
          schoolName: credData.schoolName || '',
          createdAt: now,
          expiresAt,
        },
      });

    const res = NextResponse.json({
      success: true,
      profile: {
        uid,
        email: profile.email,
        displayName: profile.displayName,
        role: 'operator_sekolah',
        schoolId: npsn,
        schoolName: credData.schoolName || '',
        isActive: true,
        createdAt: profile.createdAt,
        updatedAt: now,
        lastLogin: now,
      },
      method: 'npsn',
    });

    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.headers.set(
      'Set-Cookie',
      `auth-token=npsn:${sessionId}; path=/; max-age=86400; SameSite=Lax${secure}`
    );

    return res;
  } catch (e) {
    console.error('Login NPSN error:', e);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
