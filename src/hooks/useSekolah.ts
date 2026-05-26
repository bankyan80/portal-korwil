'use client';

import { useState, useEffect } from 'react';
import { allSekolah as staticSekolah } from '@/data/sekolah';

export interface SekolahItem {
  nama: string;
  npsn: string;
  jenjang: string;
  status: string;
  desa: string;
  address: string;
  alamat: string;
  nss: string;
  dayaTampung: number;
  kepalaSekolah: string;
}

function mapDoc(data: Record<string, any>): SekolahItem {
  const staticMatch = staticSekolah.find(s => s.npsn === data.npsn || s.nama === data.name || s.nama === data.nama);
  return {
    nama: data.name || data.nama || '',
    npsn: data.npsn || '',
    jenjang: data.jenjang || '',
    status: data.status || '',
    desa: data.desa || '',
    address: data.alamat || data.address || (staticMatch?.address || ''),
    alamat: data.alamat || data.address || (staticMatch?.address || ''),
    nss: data.nss || (staticMatch?.nss || ''),
    dayaTampung: data.dayaTampung ?? (staticMatch?.dayaTampung ?? 0),
    kepalaSekolah: data.kepalaSekolah || '',
  };
}

export function useSekolah() {
  const [schools, setSchools] = useState<SekolahItem[]>(() =>
    staticSekolah.map(s => ({
      nama: s.nama,
      npsn: s.npsn,
      jenjang: s.jenjang,
      status: s.status,
      desa: s.desa,
      address: s.address,
      alamat: s.address,
      nss: s.nss,
      dayaTampung: s.dayaTampung,
      kepalaSekolah: '',
    }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/firestore/schools')
      .then(r => r.ok ? r.json() as Promise<{ items?: any[] }> : null)
      .then((res) => {
        if (res?.items?.length) {
          const list: SekolahItem[] = res.items.map(mapDoc);
          list.sort((a, b) => a.nama.localeCompare(b.nama));
          setSchools(list);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading schools:', err);
        setLoading(false);
      });
  }, []);

  return { schools, loading };
}
