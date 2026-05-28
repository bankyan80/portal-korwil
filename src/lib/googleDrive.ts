import { google } from 'googleapis';
import { Readable } from 'stream';

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ROOT_ID || '1ROF4T8UETEfCyY_pzkwRh7c5rK7hdYSJ';

const DRIVE_FOLDER_CONFIG: Record<string, { name: string; parentKey?: string }> = {
  root: { name: 'Portal Korwil' },
  laporan_bulanan: { name: 'Laporan Bulanan', parentKey: 'root' },
  galeri: { name: 'Galeri', parentKey: 'root' },
  spmb: { name: 'SPMB', parentKey: 'root' },
  tka: { name: 'TKA', parentKey: 'root' },
  surat: { name: 'Surat', parentKey: 'root' },
  dokumen: { name: 'Dokumen Pegawai', parentKey: 'root' },
  administrasi: { name: 'Administrasi', parentKey: 'root' },
};

function getServiceAccountCredentials() {
  const envVal = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!envVal) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');

  try {
    return JSON.parse(envVal);
  } catch {
    try {
      return JSON.parse(Buffer.from(envVal, 'base64').toString('utf-8'));
    } catch {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format');
    }
  }
}

let cachedClient: ReturnType<typeof google.drive> | null = null;

export async function getDriveClient() {
  if (cachedClient) return cachedClient;

  const credentials = getServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  cachedClient = google.drive({ version: 'v3', auth });
  return cachedClient;
}

export async function findOrCreateFolder(drive: ReturnType<typeof google.drive>, folderName: string, parentFolderId?: string): Promise<string> {
  const query = parentFolderId
    ? `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed=false`
    : `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`;

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  const folderMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    folderMetadata.parents = [parentFolderId];
  }

  const createRes = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return createRes.data.id!;
}

export async function getRootFolderId(): Promise<string> {
  return ROOT_FOLDER_ID;
}

export async function getCategoryFolderId(category: string): Promise<string> {
  const drive = await getDriveClient();
  const rootId = await getRootFolderId();
  const config = DRIVE_FOLDER_CONFIG[category];
  if (!config) return rootId;

  return findOrCreateFolder(drive, config.name, rootId);
}

export interface DriveFileMetadata {
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink?: string;
  uploadedAt: string;
  uploadedBy?: string;
  sekolahId?: string;
  kategori?: string;
}

export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string,
  permissions: 'private' | 'anyone_with_link' = 'private'
): Promise<DriveFileMetadata> {
  const drive = await getDriveClient();

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: Readable.from(fileBuffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink',
  });

  const fileId = response.data.id!;

  if (permissions === 'anyone_with_link') {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  }

  return {
    driveFileId: fileId,
    fileName: response.data.name || fileName,
    mimeType: response.data.mimeType || mimeType,
    size: parseInt(response.data.size || '0', 10),
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink: response.data.webContentLink || undefined,
    uploadedAt: new Date().toISOString(),
  };
}

export async function setFilePermission(fileId: string, permission: 'private' | 'anyone_with_link'): Promise<void> {
  const drive = await getDriveClient();

  if (permission === 'anyone_with_link') {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  }
}

export async function getFileLinks(fileId: string): Promise<{ webViewLink: string; webContentLink?: string }> {
  const drive = await getDriveClient();
  const response = await drive.files.get({
    fileId,
    fields: 'webViewLink, webContentLink',
  });

  return {
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink: response.data.webContentLink || undefined,
  };
}

export function getDriveFolderStructure(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(DRIVE_FOLDER_CONFIG).map(([key, val]) => [key, val.name])
  );
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
];

export const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.js', '.sh', '.php', '.scr', '.pif', '.com', '.vbs', '.ps1', '.msi'];

export function validateFile(fileName: string, mimeType: string, fileSize: number, maxSizeBytes: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();

  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File type "${ext}" is not allowed for security reasons` };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `File type "${mimeType}" is not allowed. Allowed: PDF, Word, Excel, JPG/JPEG, PNG, WEBP, GIF, TIFF` };
  }

  if (fileSize > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size (${(fileSize / (1024 * 1024)).toFixed(1)}MB) exceeds maximum ${maxSizeMB}MB` };
  }

  return { valid: true };
}

