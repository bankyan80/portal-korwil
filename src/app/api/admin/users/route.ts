import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { adminAuth, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyAuth, requireRole } from '@/lib/server-auth';
import type { UserProfile, UserRole } from '@/types';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String(error.message);
  return String(error);
}

async function getUserProfileFromDb(uid: string): Promise<Partial<UserProfile>> {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) return {};
  try {
    const { data } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'users')
      .eq('id', uid)
      .single();
    if (data) return (data.data as Partial<UserProfile>) || {};
  } catch {}
  return {};
}

async function upsertUserProfile(uid: string, profile: Record<string, any>) {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) return;
  const { data: existing } = await supabaseAdmin
    .from('app_data')
    .select('data')
    .eq('collection', 'users')
    .eq('id', uid)
    .single();
  const merged = { ...(existing?.data as object || {}), ...profile, updatedAt: Date.now() };
  await supabaseAdmin
    .from('app_data')
    .upsert({ id: uid, collection: 'users', data: merged, updated_at: new Date().toISOString() });
}

async function deleteUserProfile(uid: string) {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) return;
  await supabaseAdmin
    .from('app_data')
    .delete()
    .eq('collection', 'users')
    .eq('id', uid);
}

export async function GET(request: Request) {
  const auth = await verifyAuth(request);
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  if (!isFirebaseAdminConfigured || !adminAuth) {
    const { mockUsers } = await import('@/lib/mock-data');
    return NextResponse.json({ users: mockUsers });
  }

  try {
    const listResult = await adminAuth.listUsers();
    const users: UserProfile[] = [];

    for (const authUser of listResult.users) {
      const uid = authUser.uid;
      const profile = await getUserProfileFromDb(uid);

      users.push({
        uid,
        email: authUser.email || profile.email || '',
        displayName: authUser.displayName || profile.displayName || authUser.email || 'Unknown',
        role: (profile.role as UserRole) || 'publik',
        photoURL: authUser.photoURL || profile.photoURL,
        schoolName: profile.schoolName,
        schoolId: profile.schoolId,
        organization: profile.organization,
        organizationId: profile.organizationId,
        phone: profile.phone,
        isActive: profile.isActive ?? true,
        lastLogin: profile.lastLogin,
        createdAt: profile.createdAt || (authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime!).getTime() : Date.now()),
        updatedAt: profile.updatedAt || Date.now(),
      });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    const { mockUsers } = await import('@/lib/mock-data');
    return NextResponse.json({ users: mockUsers });
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyAuth(request);
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json({ success: false, error: 'Database tidak dikonfigurasi' }, { status: 500 });
  }

  try {
    const { uid, role, schoolName, schoolId, organization, organizationId } = await request.json();

    if (!uid) {
      return NextResponse.json({ success: false, error: 'uid required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (schoolId !== undefined) updateData.schoolId = schoolId;
    if (organization !== undefined) updateData.organization = organization;
    if (organizationId !== undefined) updateData.organizationId = organizationId;

    await upsertUserProfile(uid, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    const forbidden = requireRole(authResult, ['super_admin']);
    if (forbidden) return forbidden;

    let email = '', role = '', schoolId = '', organizationId = '';
    try {
      const body = await request.json();
      email = (body.email || '').trim().toLowerCase();
      role = body.role || 'publik';
      schoolId = body.schoolId || '';
      organizationId = body.organizationId || '';
    } catch {
      return NextResponse.json({ success: false, error: 'Body request tidak valid' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email harus diisi' }, { status: 400 });
    }

    if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Database tidak tersedia' }, { status: 500 });
    }

    const uid = 'manual_' + email.replace(/[^a-zA-Z0-9]/g, '_');
    const now = Date.now();
    const profileData: Record<string, any> = {
      uid,
      email,
      displayName: email.split('@')[0],
      role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    if (schoolId) profileData.schoolId = schoolId;
    if (organizationId) profileData.organizationId = organizationId;

    await supabaseAdmin
      .from('app_data')
      .upsert({ id: uid, collection: 'users', data: profileData, updated_at: new Date().toISOString() });

    if (adminAuth) {
      try {
        const existingUser = await adminAuth.getUserByEmail(email);
        await deleteUserProfile(uid);
        await upsertUserProfile(existingUser.uid, { ...profileData, uid: existingUser.uid });
        return NextResponse.json({ success: true, uid: existingUser.uid });
      } catch (err: any) {
        if (getErrorMessage(err).includes('user-not-found') || err?.code === 'auth/user-not-found') {
          try {
            const created = await adminAuth.createUser({ email });
            await deleteUserProfile(uid);
            await upsertUserProfile(created.uid, { ...profileData, uid: created.uid });
            return NextResponse.json({ success: true, uid: created.uid });
          } catch {}
        }
      }
    }

    return NextResponse.json({ success: true, uid, note: 'User dibuat. Saat login Google, Auth akan auto-buat.' });
  } catch (error) {
    console.error('[admin/users POST] Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
