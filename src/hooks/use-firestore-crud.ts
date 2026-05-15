'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  addItemToCollection,
  updateItemInCollection,
  deleteItemFromCollection,
} from '@/lib/firestore-service';
import { useDataStore } from '@/store/data-store';
import type { MenuItem, Announcement, GalleryItem, Organization, InstitutionLink, UserProfile } from '@/types';

export interface FirestoreCrudHook<T extends { id: string }> {
  items: T[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  formOpen: boolean;
  deleteOpen: boolean;
  editingId: string | null;
  deletingId: string | null;
  openAdd: () => void;
  openEdit: (id: string) => void;
  closeForm: () => void;
  requestDelete: (id: string) => void;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
  updateItem: (id: string, updates: Partial<T>) => Promise<void>;
  addItem: (item: Omit<T, 'id'> & { id?: string }) => Promise<void>;
  filteredBySearch: (filterFn: (item: T, query: string) => boolean) => T[];
}

interface CrudConfig<T> {
  path: string;
  items: T[];
  loading?: boolean;
  setItems: (items: T[]) => void;
}

function useFirestoreCrudInternal<T extends { id: string }>(
  config: CrudConfig<T>
): FirestoreCrudHook<T> {
  const { path, items, loading: externalLoading, setItems } = config;

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
  }, []);

  const requestDelete = useCallback((id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingId) return;
    await deleteItemFromCollection(path, deletingId);
    setItems(items.filter(i => i.id !== deletingId));
    setDeleteOpen(false);
    setDeletingId(null);
    toast.success('Item berhasil dihapus');
  }, [deletingId, items, path, setItems]);

  const cancelDelete = useCallback(() => {
    setDeleteOpen(false);
    setDeletingId(null);
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    await updateItemInCollection(path, id, updates as Record<string, unknown>);
    setItems(items.map(i => (i.id === id ? { ...i, ...updates } : i)));
    toast.success('Item berhasil diperbarui');
  }, [items, path, setItems]);

  const addItem = useCallback(async (item: Omit<T, 'id'> & { id?: string }) => {
    const newItem = await addItemToCollection<T>(path, item);
    setItems([newItem, ...items]);
    toast.success('Item berhasil ditambahkan');
  }, [items, path, setItems]);

  const filteredBySearch = useCallback(
    (filterFn: (item: T, query: string) => boolean) => {
      if (!search.trim()) return items;
      return items.filter((item) => filterFn(item, search.toLowerCase()));
    },
    [items, search]
  );

  return {
    items,
    loading: externalLoading ?? false,
    search,
    setSearch,
    formOpen,
    deleteOpen,
    editingId,
    deletingId,
    openAdd,
    openEdit,
    closeForm,
    requestDelete,
    confirmDelete,
    cancelDelete,
    updateItem,
    addItem,
    filteredBySearch,
  };
}

export function useMenusCrud(): FirestoreCrudHook<MenuItem> {
  const items = useDataStore((s) => s.menus);
  const setItems = useDataStore((s) => s.setMenus);
  const ready = useDataStore((s) => s.ready);
  return useFirestoreCrudInternal({ path: 'menus', items, loading: !ready, setItems });
}

export function useAnnouncementsCrud(): FirestoreCrudHook<Announcement> {
  const items = useDataStore((s) => s.announcements);
  const setItems = useDataStore((s) => s.setAnnouncements);
  const ready = useDataStore((s) => s.ready);
  return useFirestoreCrudInternal({ path: 'announcements', items, loading: !ready, setItems });
}

export function useGalleryCrud(): FirestoreCrudHook<GalleryItem> {
  const items = useDataStore((s) => s.galleryItems);
  const setItems = useDataStore((s) => s.setGalleryItems);
  const ready = useDataStore((s) => s.ready);
  return useFirestoreCrudInternal({ path: 'gallery', items, loading: !ready, setItems });
}

export function useOrganizationsCrud(): FirestoreCrudHook<Organization> {
  const items = useDataStore((s) => s.organizations);
  const setItems = useDataStore((s) => s.setOrganizations);
  const ready = useDataStore((s) => s.ready);
  return useFirestoreCrudInternal({ path: 'organizations', items, loading: !ready, setItems });
}

export function useInstitutionLinksCrud(): FirestoreCrudHook<InstitutionLink> {
  const items = useDataStore((s) => s.institutionLinks);
  const setItems = useDataStore((s) => s.setInstitutionLinks);
  const ready = useDataStore((s) => s.ready);
  return useFirestoreCrudInternal({ path: 'institution_links', items, loading: !ready, setItems });
}

type UserDoc = UserProfile & { id: string };

export function useUsersCrud(): FirestoreCrudHook<UserDoc> {
  const items = useDataStore((s) => s.users);
  const setItems = useDataStore((s) => s.setUsers);
  const ready = useDataStore((s) => s.ready);
  return useFirestoreCrudInternal<UserDoc>({ path: 'users', items, loading: !ready, setItems });
}
