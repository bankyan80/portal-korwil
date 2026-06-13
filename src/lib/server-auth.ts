import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { adminAuth, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

export interface AuthResult {
  uid: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  organizationId?: string;
  isActive: boolean;
}

export async function getUserProfile(uid: string): Promise<AuthResult | null> {
  if (isSupabaseAdminConfigured() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'users')
      .eq('id', uid)
      .single();
    if (data) {
      const d = data.data as Record<string, any> || {};
      return {
        uid,
        role: (d.role as UserRole) || 'publik',
        schoolId: d.schoolId,
        schoolName: d.schoolName,
        organizationId: d.organizationId,
        isActive: d.isActive ?? true,
      };
    }
  }
  return null;
}

export async function verifyNpsnSession(sessionId: string): Promise<AuthResult | NextResponse> {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json({
      error: 'Database tidak tersedia.',
    }, { status: 500 }) as NextResponse;
  }

  const { data } = await supabaseAdmin
    .from('app_data')
    .select('*')
    .eq('collection', 'npsn_sessions')
    .eq('id', sessionId)
    .single();

  if (!data) {
    return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 }) as NextResponse;
  }

  const session = data.data as Record<string, any>;

  if (session.expiresAt && Date.now() > session.expiresAt) {
    await supabaseAdmin.from('app_data').delete().eq('id', sessionId).eq('collection', 'npsn_sessions');
    return NextResponse.json({ error: 'Sesi kedaluwarsa' }, { status: 401 }) as NextResponse;
  }

  const profile = await getUserProfile(session.uid);
  if (profile) {
    // Ensure schoolId/schoolName from session if profile is missing them
    if (!profile.schoolId && session.schoolId) {
      await supabaseAdmin
        .from('app_data')
        .update({ data: { ...profile, schoolId: session.schoolId, schoolName: session.schoolName || '' } })
        .eq('id', session.uid)
        .eq('collection', 'users');
      profile.schoolId = session.schoolId;
      profile.schoolName = profile.schoolName || session.schoolName || '';
    }
    return profile;
  }

  return {
    uid: session.uid,
    role: (session.role as UserRole) || 'publik',
    schoolId: session.schoolId,
    schoolName: session.schoolName,
    isActive: true,
  };
}

export async function verifyAuth(request: Request): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get('authorization');

  if (!isFirebaseAdminConfigured || !adminAuth) {
    return NextResponse.json({
      error: 'Firebase Admin belum dikonfigurasi. Set FIREBASE_SERVICE_ACCOUNT_KEY di Environment Variables Vercel, lalu redeploy.',
    }, { status: 500 }) as NextResponse;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const profile = await getUserProfile(decoded.uid);
    if (profile) return profile;

    return { uid: decoded.uid, role: 'publik', isActive: false };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) as NextResponse;
  }
}

export async function verifyCookieAuth(token: string): Promise<AuthResult | NextResponse> {
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }

  if (token.startsWith('npsn:')) {
    const sessionId = token.split('npsn:')[1];
    if (!sessionId) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 }) as NextResponse;
    }
    return verifyNpsnSession(sessionId);
  }

  if (!isFirebaseAdminConfigured || !adminAuth) {
    return NextResponse.json({
      error: 'Firebase Admin belum dikonfigurasi. Set FIREBASE_SERVICE_ACCOUNT_KEY di Environment Variables Vercel, lalu redeploy.',
    }, { status: 500 }) as NextResponse;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const profile = await getUserProfile(decoded.uid);
    if (profile) return profile;

    return { uid: decoded.uid, role: 'publik', isActive: false };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) as NextResponse;
  }
}

export function requireRole(authResult: AuthResult | NextResponse, allowedRoles: UserRole[]): NextResponse | null {
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  if (!authResult.isActive) {
    return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
  }
  if (!allowedRoles.includes(authResult.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
