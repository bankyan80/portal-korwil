import { NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyAuth, requireRole } from '@/lib/server-auth';
import type { UserProfile, UserRole } from '@/types';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String(error.message);
  return String(error);
}

function getErrorCode(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) return String(error.code);
  return '';
}

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
  try {
    // Verify auth via Bearer token
    const authResult = await verifyAuth(request);
    const forbidden = requireRole(authResult, ['super_admin']);
    if (forbidden) return forbidden;

    // Parse body
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

    // Tulis profil ke Firestore
    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Firestore Admin tidak tersedia' }, { status: 500 });
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

    await adminDb.collection('users').doc(uid).set(profileData, { merge: true });

    // Coba create Firebase Auth user (opsional)
    if (adminAuth) {
      try {
        const existingUser = await adminAuth.getUserByEmail(email);
        // User Auth sudah ada — update uid di Firestore
        await adminDb.collection('users').doc(uid).delete();
        await adminDb.collection('users').doc(existingUser.uid).set({ ...profileData, uid: existingUser.uid }, { merge: true });
        return NextResponse.json({ success: true, uid: existingUser.uid });
      } catch (err: any) {
        if (getErrorCode(err) === 'auth/user-not-found') {
          try {
            const created = await adminAuth.createUser({ email });
            // Update Firestore doc dengan uid asli
            await adminDb.collection('users').doc(uid).delete();
            await adminDb.collection('users').doc(created.uid).set({ ...profileData, uid: created.uid }, { merge: true });
            return NextResponse.json({ success: true, uid: created.uid });
          } catch {}
        }
      }
    }

    return NextResponse.json({ success: true, uid, note: 'User dibuat di Firestore. Saat login Google, Auth akan auto-buat.' });
  } catch (error) {
    console.error('[admin/users POST] Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
