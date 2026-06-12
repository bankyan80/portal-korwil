import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.portalkorwil.online';
  const pages = [
    '', '/profil', '/spmb-sd', '/master-data',
    '/data-sekolah',
    '/yatim-piatu', '/kip-sd', '/bos-arkas', '/mapping-pegawai',
    '/laporan', '/rekap-laporan', '/berita', '/galeri', '/semua-galeri',
    '/semua-informasi', '/kalender', '/agenda-kegiatan',
    '/ruang-guru', '/e-kinerja', '/administrasi',
    '/donasi', '/spmb-sd/cek', '/bup',
  ];

  return pages.map(path => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'weekly' as const : 'monthly' as const,
    priority: path === '' ? 1.0 : 0.6,
  }));
}
