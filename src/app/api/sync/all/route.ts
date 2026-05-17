import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import fs from 'fs';
import path from 'path';

function loadSiswa(): any[] {
  const p = path.join(process.cwd(), 'src', 'data', 'data-siswa.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function loadPegawai(): any[] {
  const p = path.join(process.cwd(), 'src', 'data', 'data-pegawai.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function syncCollection(data: any[], collectionName: string, idField: string): Promise<number> {
  const collection = adminDb!.collection(collectionName);
  let committed = 0;
  for (let i = 0; i < data.length; i += 500) {
    const batch = adminDb!.batch();
    const chunk = data.slice(i, i + 500);
    for (const item of chunk) {
      const id = item[idField] || `${item.sekolah}_${item.nama}`;
      batch.set(collection.doc(String(id)), {
        ...item,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
    committed += chunk.length;
  }
  return committed;
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
    const siswa = loadSiswa();
    const pegawai = loadPegawai();
    const results: { type: string; count: number }[] = [];

    const siswaCount = await syncCollection(siswa, 'siswa', 'nik');
    results.push({ type: 'siswa', count: siswaCount });

    const pegawaiCount = await syncCollection(pegawai, 'employees', 'nik');
    results.push({ type: 'pegawai', count: pegawaiCount });

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi selesai: ${siswaCount} siswa, ${pegawaiCount} pegawai`,
      results,
    });
  } catch (error) {
    console.error('Error syncing all data:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyinkronkan data' },
      { status: 500 }
    );
  }
}
