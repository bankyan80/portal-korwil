import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'portal-files';

function getSafeFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const base = fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const timestamp = Date.now();
  return `${timestamp}-${base}.${ext}`;
}

function getStoragePath(category: string, tahun?: string, bulan?: string, sekolahId?: string, safeFileName?: string): string {
  const parts: string[] = [];
  switch (category) {
    case 'laporan_bulanan':
      parts.push('laporan-bulanan', tahun || 'unknown', (bulan || 'unknown').toLowerCase(), sekolahId || 'unknown');
      break;
    case 'galeri':
      parts.push('galeri', tahun || 'unknown', sekolahId || 'unknown');
      break;
    case 'berita':
      parts.push('berita', tahun || 'unknown');
      break;
    case 'spmb':
      parts.push('spmb', tahun || 'unknown', sekolahId || 'unknown', 'berkas');
      break;
    case 'tka':
      parts.push('tka', tahun || 'unknown', sekolahId || 'unknown', 'bukti-upload');
      break;
    case 'surat_masuk':
      parts.push('surat', 'masuk', tahun || 'unknown');
      break;
    case 'surat_keluar':
      parts.push('surat', 'keluar', tahun || 'unknown');
      break;
    case 'arsip':
      parts.push('arsip', 'sekolah', sekolahId || 'unknown');
      break;
    case 'administrasi':
      parts.push('administrasi', sekolahId || 'unknown');
      break;
    case 'pegawai':
      parts.push('pegawai', sekolahId || 'unknown', 'dokumen');
      break;
    case 'siswa':
      parts.push('siswa', sekolahId || 'unknown', 'dokumen');
      break;
    case 'dokumen':
      parts.push('dokumen', sekolahId || 'unknown');
      break;
    default:
      parts.push(category, sekolahId || 'unknown');
  }
  parts.push(safeFileName || 'file');
  return parts.join('/');
}

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase tidak dikonfigurasi' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const kategori = formData.get('kategori') as string || 'dokumen';
    const tahun = formData.get('tahun') as string | undefined;
    const bulan = formData.get('bulan') as string | undefined;
    const sekolahId = formData.get('sekolahId') as string | undefined;
    const uploadedBy = formData.get('uploadedBy') as string | undefined;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeFileName = getSafeFileName(file.name);
    const storagePath = getStoragePath(kategori, tahun, bulan, sekolahId, safeFileName);

    const { data, error } = await supabase.storage
      .from(storageBucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: `Upload gagal: ${error.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      data: {
        provider: 'supabase',
        bucket: storageBucket,
        fileName: safeFileName,
        originalName: file.name,
        storagePath,
        fileUrl: urlData.publicUrl,
        mimeType: file.type,
        size: file.size,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Supabase tidak dikonfigurasi' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { storagePath } = await req.json();
    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath required' }, { status: 400 });
    }

    const { error } = await supabase.storage
      .from(storageBucket)
      .remove([storagePath]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
