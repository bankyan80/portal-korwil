import { NextRequest, NextResponse } from 'next/server';

export function checkRole(request: NextRequest, allowedRoles: string[]) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (!allowedRoles.includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
