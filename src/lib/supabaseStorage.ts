import { supabase, STORAGE_BUCKET, isSupabaseConfigured } from './supabaseClient';

export interface UploadParams {
  file: File;
  category: string;
  tahun?: number;
  bulan?: string;
  sekolahId?: string;
  sekolahNama?: string;
  uploadedBy?: string;
}

export interface SupabaseFileMetadata {
  provider: 'supabase';
  bucket: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  sizeText: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface UploadResult {
  success: boolean;
  metadata?: SupabaseFileMetadata;
  error?: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.js', '.sh', '.php', '.html', '.scr', '.pif', '.com', '.vbs', '.ps1', '.msi'];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_DOC_SIZE = 5 * 1024 * 1024;

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateFile(file: File): { valid: boolean; error?: string } {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();

  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Tipe file "${ext}" tidak diizinkan` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `Format file tidak diizinkan. Gunakan: PDF, Word, Excel, JPG, PNG, WEBP` };
  }

  const isImage = IMAGE_MIME_TYPES.includes(file.type);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `Ukuran file (${formatFileSize(file.size)}) melebihi batas maksimal ${maxMB} MB` };
  }

  return { valid: true };
}

export function getSafeFileName(fileName: string): string {
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

export function getSupabaseStoragePath(params: { category: string; tahun?: number; bulan?: string; sekolahId?: string; safeFileName: string }): string {
  const parts: string[] = [];

  switch (params.category) {
    case 'laporan_bulanan':
      parts.push('laporan-bulanan');
      if (params.tahun) parts.push(String(params.tahun));
      if (params.bulan) parts.push(params.bulan.toLowerCase());
      if (params.sekolahId) parts.push(params.sekolahId);
      break;
    case 'galeri':
      parts.push('galeri');
      if (params.tahun) parts.push(String(params.tahun));
      if (params.sekolahId) parts.push(params.sekolahId);
      break;
    case 'berita':
      parts.push('berita');
      if (params.tahun) parts.push(String(params.tahun));
      break;
    case 'spmb':
      parts.push('spmb');
      if (params.tahun) parts.push(String(params.tahun));
      if (params.sekolahId) parts.push(params.sekolahId);
      parts.push('berkas');
      break;
    case 'tka':
      parts.push('tka');
      if (params.tahun) parts.push(String(params.tahun));
      if (params.sekolahId) parts.push(params.sekolahId);
      parts.push('bukti-upload');
      break;
    case 'surat_masuk':
      parts.push('surat', 'masuk');
      if (params.tahun) parts.push(String(params.tahun));
      break;
    case 'surat_keluar':
      parts.push('surat', 'keluar');
      if (params.tahun) parts.push(String(params.tahun));
      break;
    case 'arsip':
      parts.push('arsip', 'sekolah');
      if (params.sekolahId) parts.push(params.sekolahId);
      break;
    case 'administrasi':
      parts.push('administrasi');
      if (params.sekolahId) parts.push(params.sekolahId);
      break;
    case 'pegawai':
      parts.push('pegawai');
      if (params.sekolahId) parts.push(params.sekolahId);
      parts.push('dokumen');
      break;
    case 'siswa':
      parts.push('siswa');
      if (params.sekolahId) parts.push(params.sekolahId);
      parts.push('dokumen');
      break;
    default:
      parts.push(params.category);
      if (params.sekolahId) parts.push(params.sekolahId);
  }

  parts.push(params.safeFileName);
  return parts.join('/');
}

export async function uploadFileToSupabase(params: UploadParams): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase tidak tersambung' };
  }

  const validation = validateFile(params.file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const safeFileName = getSafeFileName(params.file.name);
  const storagePath = getSupabaseStoragePath({
    category: params.category,
    tahun: params.tahun,
    bulan: params.bulan,
    sekolahId: params.sekolahId,
    safeFileName,
  });

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, params.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: params.file.type,
    });

  if (error) {
    return { success: false, error: `Upload gagal: ${error.message}` };
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  const metadata: SupabaseFileMetadata = {
    provider: 'supabase',
    bucket: STORAGE_BUCKET,
    fileName: safeFileName,
    originalName: params.file.name,
    storagePath,
    fileUrl: urlData.publicUrl,
    mimeType: params.file.type,
    size: params.file.size,
    sizeText: formatFileSize(params.file.size),
    uploadedBy: params.uploadedBy,
    uploadedAt: new Date().toISOString(),
  };

  return { success: true, metadata };
}

export async function deleteFileFromSupabase(storagePath: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase tidak tersambung' };
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function getSignedUrl(storagePath: string, expiresIn = 3600): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase tidak tersambung' };
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, url: data.signedUrl };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
