export type GalleryCategory =
  | 'SD' | 'TK' | 'PAUD' | 'K3S' | 'IGTKI' | 'HIMPAUDI'
  | 'PGRI' | 'FKKG' | 'FKKG PAI' | 'FKKGO'
  | 'Forum Operator' | 'Tim Kerja Kecamatan';

export type GalleryStatus = 'draft' | 'pending' | 'published' | 'rejected';

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  url: string;
  active: boolean;
  order: number;
  category?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  pinned: boolean;
  author: string;
}

export interface GalleryImageFile {
  provider?: 'supabase' | 'google-drive';
  driveFileId?: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  webContentLink?: string;
  fileUrl?: string;
  storagePath?: string;
  uploadedAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  /** Array of Drive image URLs (webViewLink) or legacy base64 strings */
  images: string[];
  imageFiles?: GalleryImageFile[];
  category: GalleryCategory;
  authorName: string;
  authorRole: string;
  schoolId?: string;
  schoolName?: string;
  status: GalleryStatus;
  createdAt: number;
}

export interface Organization {
  id: string;
  name: string;
  logo: string;
  leader: string;
  contact: string;
  active: boolean;
  description?: string;
  vision?: string;
  mission?: string[];
  board?: { jabatan: string; nama: string }[];
}

export interface InstitutionLink {
  id: string;
  name: string;
  logo: string;
  url: string;
  active: boolean;
  order: number;
}

export interface HeroData {
  name: string;
  title: string;
  greeting: string;
  photoURL: string;
}

export interface FooterData {
  address: string;
  email: string;
  phone: string;
}
