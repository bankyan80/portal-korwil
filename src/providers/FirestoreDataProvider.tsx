'use client';

import { useEffect } from 'react';
import { useDataStore } from '@/store/data-store';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import { db } from '@/lib/firebase';
import { mockMenus, mockAnnouncements, mockGalleryItems, mockOrganizations, mockInstitutionLinks } from '@/lib/mock-data';
import type { MenuItem, Announcement, GalleryItem, Organization, InstitutionLink } from '@/types';

interface FirestoreDataProviderProps {
  children: React.ReactNode;
}

function allEmpty(...items: unknown[][]): boolean {
  return items.every((arr) => arr.length === 0);
}

export function FirestoreDataProvider({ children }: FirestoreDataProviderProps) {
  const setMenus = useDataStore((s) => s.setMenus);
  const setAnnouncements = useDataStore((s) => s.setAnnouncements);
  const setGalleryItems = useDataStore((s) => s.setGalleryItems);
  const setOrganizations = useDataStore((s) => s.setOrganizations);
  const setInstitutionLinks = useDataStore((s) => s.setInstitutionLinks);
  const setReady = useDataStore((s) => s.setReady);

  const menusHook = useFirestoreCollection<MenuItem>('menus', [], 'order');
  const announcementsHook = useFirestoreCollection<Announcement>('announcements', [], 'createdAt');
  const galleryHook = useFirestoreCollection<GalleryItem>('gallery', [], 'createdAt');
  const organizationsHook = useFirestoreCollection<Organization>('organizations', []);
  const institutionLinksHook = useFirestoreCollection<InstitutionLink>('institution_links', [], 'order');

  useEffect(() => {
    const allLoaded =
      !menusHook.loading &&
      !announcementsHook.loading &&
      !galleryHook.loading &&
      !organizationsHook.loading &&
      !institutionLinksHook.loading;

    if (allLoaded) {
      const mockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
      const useMock = mockEnabled && !db && allEmpty(
        menusHook.items,
        announcementsHook.items,
        galleryHook.items,
        organizationsHook.items,
        institutionLinksHook.items
      );

      setMenus(useMock ? mockMenus : menusHook.items);
      setAnnouncements(useMock ? mockAnnouncements : announcementsHook.items);
      setGalleryItems(useMock ? mockGalleryItems : galleryHook.items);
      setOrganizations(useMock ? mockOrganizations : organizationsHook.items);
      setInstitutionLinks(useMock ? mockInstitutionLinks : institutionLinksHook.items);
      setReady(true);
    }
  }, [
    menusHook.items, menusHook.loading,
    announcementsHook.items, announcementsHook.loading,
    galleryHook.items, galleryHook.loading,
    organizationsHook.items, organizationsHook.loading,
    institutionLinksHook.items, institutionLinksHook.loading,
    setMenus, setAnnouncements, setGalleryItems, setOrganizations, setInstitutionLinks, setReady
  ]);

  return <>{children}</>;
}
