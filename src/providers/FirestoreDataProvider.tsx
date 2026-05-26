'use client';

import { useEffect, useState } from 'react';
import { useDataStore } from '@/store/data-store';
import { mockMenus, mockAnnouncements, mockGalleryItems, mockOrganizations, mockInstitutionLinks } from '@/lib/mock-data';
import type { MenuItem, Announcement, GalleryItem, Organization, InstitutionLink } from '@/types';

interface FirestoreDataProviderProps {
  children: React.ReactNode;
}

async function apiGetCollection<T>(collection: string, orderBy?: string): Promise<T[]> {
  try {
    const params = new URLSearchParams();
    if (orderBy) params.set('orderBy', orderBy);
    const res = await fetch(`/api/firestore/${collection}?${params}`);
    const json = await res.json();
    return json.items || [];
  } catch { return []; }
}

export function FirestoreDataProvider({ children }: FirestoreDataProviderProps) {
  const setMenus = useDataStore((s) => s.setMenus);
  const setAnnouncements = useDataStore((s) => s.setAnnouncements);
  const setGalleryItems = useDataStore((s) => s.setGalleryItems);
  const setOrganizations = useDataStore((s) => s.setOrganizations);
  const setInstitutionLinks = useDataStore((s) => s.setInstitutionLinks);
  const setReady = useDataStore((s) => s.setReady);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

    Promise.all([
      apiGetCollection<MenuItem>('menus', 'order'),
      apiGetCollection<Announcement>('announcements', 'createdAt'),
      apiGetCollection<GalleryItem>('gallery', 'createdAt'),
      apiGetCollection<Organization>('organizations'),
      apiGetCollection<InstitutionLink>('institution_links', 'order'),
    ]).then(([menus, announcements, gallery, organizations, institutionLinks]) => {
      const allEmpty = [menus, announcements, gallery, organizations, institutionLinks].every(a => a.length === 0);
      const useMock = mockEnabled && allEmpty;

      setMenus(useMock ? mockMenus : menus);
      setAnnouncements(useMock ? mockAnnouncements : announcements);
      setGalleryItems(useMock ? mockGalleryItems : gallery);
      setOrganizations(useMock ? mockOrganizations : organizations);
      setInstitutionLinks(useMock ? mockInstitutionLinks : institutionLinks);
    }).finally(() => {
      setLoading(false);
      setReady(true);
    });
  }, [setMenus, setAnnouncements, setGalleryItems, setOrganizations, setInstitutionLinks, setReady]);

  return <>{children}</>;
}
