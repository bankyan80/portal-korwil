import { create } from 'zustand';
import type { MenuItem, Announcement, GalleryItem, Organization, InstitutionLink, UserProfile } from '@/types';

interface DataState {
  menus: MenuItem[]
  announcements: Announcement[]
  galleryItems: GalleryItem[]
  organizations: Organization[]
  institutionLinks: InstitutionLink[]
  users: UserProfile[]
  ready: boolean

  setMenus: (items: MenuItem[]) => void
  setAnnouncements: (items: Announcement[]) => void
  setGalleryItems: (items: GalleryItem[]) => void
  setOrganizations: (items: Organization[]) => void
  setInstitutionLinks: (items: InstitutionLink[]) => void
  setUsers: (items: UserProfile[]) => void
  setReady: (v: boolean) => void
}

export const useDataStore = create<DataState>((set) => ({
  menus: [],
  announcements: [],
  galleryItems: [],
  organizations: [],
  institutionLinks: [],
  users: [],
  ready: false,
  setReady: (v) => set({ ready: v }),

  setMenus: (items) => set({ menus: items }),
  setAnnouncements: (items) => set({ announcements: items }),
  setGalleryItems: (items) => set({ galleryItems: items }),
  setOrganizations: (items) => set({ organizations: items }),
  setInstitutionLinks: (items) => set({ institutionLinks: items }),
  setUsers: (items) => set({ users: items }),
}));
