import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';

function loadData(): any[] {
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

export async function POST(request: NextRequest) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json(
      { success: false, error: 'Firebase Admin tidak dikonfigurasi' },
      { status: 500 }
    );
  }

  // Verify auth
  const token = request.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  try {
    const allData = loadData();
    if (allData.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada data pegawai' });
    }

    const collection = adminDb.collection('employees');
    let committed = 0;

    for (let i = 0; i < allData.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = allData.slice(i, i + 500);

      for (const pegawai of chunk) {
        const docRef = collection.doc(pegawai.nik || pegawai.nuptk || `${pegawai.sekolah}_${pegawai.nama}`);
        batch.set(docRef, {
          ...pegawai,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      committed += chunk.length;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyinkronkan ${committed} pegawai ke Firestore`,
      count: committed,
    });
  } catch (error) {
    console.error('Error syncing pegawai:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyinkronkan data pegawai' },
      { status: 500 }
    );
  }
}
