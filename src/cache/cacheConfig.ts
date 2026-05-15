export const CACHE_VERSION = 1;

export const TTL = {
  DASHBOARD_SUMMARY: 30_000,
  COLLECTION_SMALL: 60_000,
  COLLECTION_MEDIUM: 120_000,
  COLLECTION_LARGE: 300_000,
  STATIC_DATA: 600_000,
  SCHOOL_PROFILE: 300_000,
  STUDENT_COUNTS: 120_000,
} as const;

export type CacheableCollection = keyof typeof COLLECTION_CACHE_CONFIG;

export const COLLECTION_CACHE_CONFIG: Record<string, { ttl: number }> = {
  users: { ttl: TTL.COLLECTION_MEDIUM },
  schools: { ttl: TTL.COLLECTION_MEDIUM },
  students: { ttl: TTL.COLLECTION_LARGE },
  employees: { ttl: TTL.COLLECTION_MEDIUM },
  organizations: { ttl: TTL.COLLECTION_MEDIUM },
  reports: { ttl: TTL.COLLECTION_MEDIUM },
  laporan_bulanan: { ttl: TTL.COLLECTION_MEDIUM },
  kip_sd: { ttl: TTL.COLLECTION_MEDIUM },
  yatim_piatu: { ttl: TTL.COLLECTION_MEDIUM },
  dokumen: { ttl: TTL.COLLECTION_MEDIUM },
  bos_arkas: { ttl: TTL.COLLECTION_SMALL },
  tabel_sekolah: { ttl: TTL.COLLECTION_LARGE },
  settings: { ttl: TTL.COLLECTION_MEDIUM },
  dashboard_summary: { ttl: TTL.DASHBOARD_SUMMARY },
  menus: { ttl: TTL.COLLECTION_SMALL },
  announcements: { ttl: TTL.COLLECTION_SMALL },
  gallery: { ttl: TTL.COLLECTION_MEDIUM },
  institution_links: { ttl: TTL.COLLECTION_SMALL },
  news: { ttl: TTL.COLLECTION_SMALL },
  program_kerja: { ttl: TTL.COLLECTION_MEDIUM },
  spmb_sd: { ttl: TTL.COLLECTION_MEDIUM },
  calendar_events: { ttl: TTL.COLLECTION_MEDIUM },
  agenda: { ttl: TTL.COLLECTION_MEDIUM },
};

export const CACHE_PREFIX = 'portal_dinas_';
export const CACHE_KEY_SEPARATOR = '__';
