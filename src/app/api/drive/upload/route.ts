import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { uploadFileToDrive, getCategoryFolderId, validateFile, DriveFileMetadata } from '@/lib/googleDrive';
import { getServiceAccount } from '@/lib/firebase-admin';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

function getFirebaseAdminAuth() {
  const sa = getServiceAccount();
  if (!sa) throw new Error('Firebase Admin not configured');

  if (!getApps().length) {
    initializeApp({ credential: cert(sa) });
  }

  return getAuth();
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const kategori = formData.get('kategori') as string || 'dokumen';
    const sekolahId = formData.get('sekolahId') as string | undefined;
    const uploadedBy = formData.get('uploadedBy') as string || decodedToken.uid;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = validateFile(file.name, file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let folderId: string;
    const kategoriLower = kategori.toLowerCase();

    if (kategoriLower === 'laporan_bulanan') {
      const tahun = formData.get('tahun') as string || new Date().getFullYear().toString();
      const bulan = formData.get('bulan') as string || 'Lainnya';
      const { getDriveClient, findOrCreateFolder, getRootFolderId } = await import('@/lib/googleDrive');
      const rootId = await getRootFolderId();
      const drive = await getDriveClient();
      const laporanFolder = await findOrCreateFolder(drive, 'Laporan Bulanan', rootId);
      const tahunFolder = await findOrCreateFolder(drive, tahun, laporanFolder);
      const bulanFolder = await findOrCreateFolder(drive, bulan, tahunFolder);
      const sekolahName = sekolahId || 'Unknown';
      folderId = await findOrCreateFolder(drive, sekolahName, bulanFolder);
    } else if (kategoriLower === 'galeri') {
      const { getDriveClient, findOrCreateFolder, getRootFolderId } = await import('@/lib/googleDrive');
      const rootId = await getRootFolderId();
      const drive = await getDriveClient();
      const galeriFolder = await findOrCreateFolder(drive, 'Galeri', rootId);
      const tahunFolder = await findOrCreateFolder(drive, new Date().getFullYear().toString(), galeriFolder);
      folderId = await findOrCreateFolder(drive, 'Kegiatan', tahunFolder);
    } else if (kategoriLower === 'spmb') {
      const { getDriveClient, findOrCreateFolder, getRootFolderId } = await import('@/lib/googleDrive');
      const rootId = await getRootFolderId();
      const drive = await getDriveClient();
      const spmbFolder = await findOrCreateFolder(drive, 'SPMB', rootId);
      const tahunAjaran = formData.get('tahunAjaran') as string || '2026-2027';
      const tahunFolder = await findOrCreateFolder(drive, tahunAjaran, spmbFolder);
      folderId = await findOrCreateFolder(drive, 'Berkas Pendaftar', tahunFolder);
    } else if (kategoriLower === 'tka') {
      const { getDriveClient, findOrCreateFolder, getRootFolderId } = await import('@/lib/googleDrive');
      const rootId = await getRootFolderId();
      const drive = await getDriveClient();
      const tkaFolder = await findOrCreateFolder(drive, 'TKA', rootId);
      const tahunFolder = await findOrCreateFolder(drive, new Date().getFullYear().toString(), tkaFolder);
      folderId = await findOrCreateFolder(drive, 'Bukti Upload', tahunFolder);
    } else if (kategoriLower === 'surat') {
      const { getDriveClient, findOrCreateFolder, getRootFolderId } = await import('@/lib/googleDrive');
      const rootId = await getRootFolderId();
      const drive = await getDriveClient();
      const suratFolder = await findOrCreateFolder(drive, 'Surat', rootId);
      const jenisSurat = formData.get('jenisSurat') as string || 'Masuk';
      folderId = await findOrCreateFolder(drive, jenisSurat, suratFolder);
    } else {
      folderId = await getCategoryFolderId(kategoriLower);
    }

    const isPublic = kategoriLower === 'galeri';
    const metadata = await uploadFileToDrive(
      buffer,
      file.name,
      file.type,
      folderId,
      isPublic ? 'anyone_with_link' : 'private'
    );

    const result: DriveFileMetadata & { uploadedBy: string; sekolahId?: string; kategori: string } = {
      ...metadata,
      uploadedBy,
      sekolahId,
      kategori,
    };

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error('[drive-upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
