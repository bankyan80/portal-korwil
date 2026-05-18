import { NextRequest, NextResponse } from 'next/server';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';
import { normalizeSchool } from '@/lib/normalize';
import type { UserRole } from '@/types';

export async function PUT(req: NextRequest, { params }: { params: { nik: string } }) {
  try {
    const cookieToken = req.cookies.get('auth-token')?.value;
    if (!cookieToken) {
      return NextResponse.json({ error: 'Unauthorized — tidak ada token' }, { status: 401 });
    }

    const authResult = await verifyCookieAuth(cookieToken);
    if (authResult instanceof NextResponse) return authResult;

    const forbidden = requireRole(authResult as any, ['super_admin', 'operator_sekolah']);
    if (forbidden) return forbidden;

    const { nik } = params;
    if (!nik) {
      return NextResponse.json({ error: 'NIK wajib diisi' }, { status: 400 });
    }

    const body = await req.json();
    const allowedKeys = [
      'nik', 'nama', 'jk', 'nuptk', 'nip', 'tanggal_lahir', 'tempat_lahir',
      'agama', 'alamat', 'rt', 'rw', 'dusun', 'desa', 'kecamatan', 'kode_pos',
      'telepon', 'hp', 'email', 'status_kepegawaian', 'jenis_ptk',
      'tugas_tambahan', 'sertifikasi', 'sekolah',
      'sk_cpns', 'tanggal_cpns', 'pangkat', 'golongan',
    ];
    const updateData: Record<string, any> = {};
    let renamedNik: string | null = null;
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        if (key === 'nik') {
          renamedNik = String(body[key]);
        } else {
          updateData[key] = body[key];
        }
      }
    }

    // operator_sekolah: only allow updating their own school's records
    if (authResult.role === 'operator_sekolah') {
      const { adminDb } = await import('@/lib/firebase-admin');
      const docRef = adminDb.collection('employees').doc(nik);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Data pegawai tidak ditemukan' }, { status: 404 });
      }
      const existingData = docSnap.data();
      const actorSchool = existingData?.sekolah || '';
      const userDoc = await adminDb.collection('users').doc(authResult.uid).get();
      const operatorSchool = userDoc.data()?.schoolName || '';
      if (!operatorSchool || normalizeSchool(actorSchool) !== normalizeSchool(operatorSchool)) {
        return NextResponse.json({ error: 'Forbidden — hanya bisa mengubah data sekolah sendiri' }, { status: 403 });
      }
    }

    const { adminDb } = await import('@/lib/firebase-admin');
    const docRef = adminDb.collection('employees').doc(nik);
    const exists = (await docRef.get()).exists;
    if (!exists) {
      return NextResponse.json({ error: 'Data pegawai tidak ditemukan' }, { status: 404 });
    }

    updateData.updatedAt = Date.now();
    await docRef.set(updateData, { merge: true });

    // If NIK changed, copy to new document and delete old
    if (renamedNik && renamedNik !== nik) {
      const fullData = (await docRef.get()).data();
      if (fullData) {
        const newDocRef = adminDb.collection('employees').doc(renamedNik);
        await newDocRef.set({ ...fullData, nik: renamedNik, updatedAt: Date.now() });
        await docRef.delete();
      }
    }

    return NextResponse.json({ success: true, message: 'Data pegawai berhasil diperbarui' });
  } catch (error) {
    console.error('Update pegawai error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data pegawai' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { nik: string } }) {
  try {
    const cookieToken = req.cookies.get('auth-token')?.value;
    if (!cookieToken) {
      return NextResponse.json({ error: 'Unauthorized — tidak ada token' }, { status: 401 });
    }

    const authResult = await verifyCookieAuth(cookieToken);
    if (authResult instanceof NextResponse) return authResult;

    const forbidden = requireRole(authResult as any, ['super_admin']);
    if (forbidden) return forbidden;

    const { nik } = params;
    if (!nik) {
      return NextResponse.json({ error: 'NIK wajib diisi' }, { status: 400 });
    }

    const { adminDb } = await import('@/lib/firebase-admin');
    if (adminDb) {
      const docRef = adminDb.collection('employees').doc(nik);
      const doc = await docRef.get();
      if (doc.exists) {
        await docRef.delete();
      }
    }

    return NextResponse.json({ success: true, message: 'Data pegawai berhasil dihapus' });
  } catch (error) {
    console.error('Delete pegawai error:', error);
    return NextResponse.json({ error: 'Gagal menghapus data pegawai' }, { status: 500 });
  }
}
