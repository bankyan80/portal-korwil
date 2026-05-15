import { NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyAuth, requireRole } from '@/lib/server-auth';
import type { UserProfile, UserRole } from '@/types';

export async function GET(request: Request) {
  const auth = await verifyAuth(request);
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) {
    const { mockUsers } = await import('@/lib/mock-data');
    return NextResponse.json({ users: mockUsers });
  }

  try {
    const listResult = await adminAuth.listUsers();
    const users: UserProfile[] = [];

    for (const authUser of listResult.users) {
      const uid = authUser.uid;
      let profile: Partial<UserProfile> = {};

      try {
        const docSnap = await adminDb.collection('users').doc(uid).get();
        if (docSnap.exists) {
          profile = docSnap.data() as Partial<UserProfile>;
        }
      } catch {}

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
        createdAt: profile.createdAt || authUser.metadata.creationTime ? new Date(authUser.metadata.creationTime!).getTime() : Date.now(),
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

  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ success: false, error: 'Admin not configured' }, { status: 500 });
  }

  try {
    const { uid, role, schoolName, schoolId, organization, organizationId } = await request.json();

    if (!uid) {
      return NextResponse.json({ success: false, error: 'uid required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: Date.now() };
    if (role) updateData.role = role;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (schoolId !== undefined) updateData.schoolId = schoolId;
    if (organization !== undefined) updateData.organization = organization;
    if (organizationId !== undefined) updateData.organizationId = organizationId;

    await adminDb.collection('users').doc(uid).set(updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAuth(request);
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Admin not configured' }, { status: 500 });
  }

  try {
    const { email, role, schoolId, organizationId } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    let uid: string;

    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
    } catch {
      const newUser = await adminAuth.createUser({ email });
      uid = newUser.uid;
    }

    const now = Date.now();
    const profileData: Record<string, unknown> = {
      uid,
      email,
      displayName: email.split('@')[0],
      role: role || 'publik',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    if (schoolId) {
      profileData.schoolId = schoolId;
      try {
        const schoolSnap = await adminDb.collection('schools').doc(schoolId).get();
        if (schoolSnap.exists) profileData.schoolName = schoolSnap.data()?.name || '';
      } catch {}
    }
    if (organizationId) {
      profileData.organizationId = organizationId;
      try {
        const orgSnap = await adminDb.collection('organizations').doc(organizationId).get();
        if (orgSnap.exists) profileData.organization = orgSnap.data()?.name || '';
      } catch {}
    }

    await adminDb.collection('users').doc(uid).set(profileData, { merge: true });

    return NextResponse.json({ success: true, uid });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}
