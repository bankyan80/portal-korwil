import { NextResponse } from 'next/server';
import { adminAuth, adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import type { UserRole } from '@/types';

interface AuthResult {
  uid: string;
  role: UserRole;
}

export async function verifyAuth(request: Request): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get('authorization');

  if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 }) as NextResponse;
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
    }

    return { uid: decoded.uid, role };
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 }) as NextResponse;
  }
}

export function requireRole(authResult: AuthResult | NextResponse, allowedRoles: UserRole[]): NextResponse | null {
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  if (!allowedRoles.includes(authResult.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
