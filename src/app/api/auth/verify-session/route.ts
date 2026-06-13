import { NextResponse } from 'next/server';
import { verifyCookieAuth } from '@/lib/server-auth';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]*)/);

  if (!match) {
    return NextResponse.json({ valid: false, error: 'Tidak ada sesi' });
  }

  const result = await verifyCookieAuth(match[1]);
  if (result instanceof NextResponse) {
    return NextResponse.json({ valid: false, error: 'Sesi tidak valid' });
  }

  let fullProfile: Record<string, any> | null = null;
  if (isSupabaseAdminConfigured() && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('app_data')
      .select('*')
      .eq('collection', 'users')
      .eq('id', result.uid)
      .single();
    if (data) {
      fullProfile = data.data as Record<string, any>;
    }
  }

  const authResult = result as any;
  return NextResponse.json({
    valid: true,
    profile: {
      ...(fullProfile || {}),
      uid: fullProfile?.uid || authResult.uid,
      role: fullProfile?.role || authResult.role,
      isActive: fullProfile?.isActive ?? authResult.isActive ?? true,
      schoolId: fullProfile?.schoolId || authResult.schoolId || '',
      schoolName: fullProfile?.schoolName || authResult.schoolName || '',
    },
  });
}
