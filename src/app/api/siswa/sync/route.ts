import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Endpoint ini sudah tidak digunakan. API sinkronisasi JSON→Firestore dihapus karena Firestore bukan lagi primary storage untuk data siswa.',
    deprecated: true,
  }, { status: 410 });
}
