'use client';

import { useEffect } from 'react';
import { useDataStore } from '@/store/data-store';
import { useFirestoreCollection } from '@/hooks/use-firestore-collection';
import type { MenuItem, Announcement, GalleryItem, Organization, InstitutionLink } from '@/types';

interface FirestoreDataProviderProps {
  children: React.ReactNode;
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
      setMenus(menusHook.items);
      setAnnouncements(announcementsHook.items);
      setGalleryItems(galleryHook.items);
      setOrganizations(organizationsHook.items);
      setInstitutionLinks(institutionLinksHook.items);
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
