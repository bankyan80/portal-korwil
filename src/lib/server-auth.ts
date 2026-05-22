import { NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

export interface AuthResult {
  uid: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  organizationId?: string;
  isActive: boolean;
}

export async function verifyAuth(request: Request): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get('authorization');

  if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) {
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
    const docSnap = await adminDb.collection('users').doc(decoded.uid).get();
    let role: UserRole = 'publik';

    if (docSnap.exists) {
      const data = docSnap.data();
      role = (data?.role as UserRole) || 'publik';
      return {
        uid: decoded.uid,
        role,
        schoolId: data?.schoolId,
        schoolName: data?.schoolName,
        organizationId: data?.organizationId,
        isActive: data?.isActive ?? true,
      };
    }

    return { uid: decoded.uid, role, isActive: false };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) as NextResponse;
  }
}

export async function verifyCookieAuth(token: string): Promise<AuthResult | NextResponse> {
  if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) {
    return NextResponse.json({
      error: 'Firebase Admin belum dikonfigurasi. Set FIREBASE_SERVICE_ACCOUNT_KEY di Environment Variables Vercel, lalu redeploy.',
    }, { status: 500 }) as NextResponse;
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const docSnap = await adminDb.collection('users').doc(decoded.uid).get();
    let role: UserRole = 'publik';

    if (docSnap.exists) {
      const data = docSnap.data();
      role = (data?.role as UserRole) || 'publik';
      return {
        uid: decoded.uid,
        role,
        schoolId: data?.schoolId,
        schoolName: data?.schoolName,
        organizationId: data?.organizationId,
        isActive: data?.isActive ?? true,
      };
    }

    return { uid: decoded.uid, role, isActive: false };
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
