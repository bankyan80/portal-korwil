// ============================================================
// Portal Pendidikan Kecamatan Lemahabang - Zustand App Store
// ============================================================
// Central client-side state management using Zustand.
// Handles SPA-style view routing, authentication state, and
// admin sidebar toggle.
// ============================================================

import { create } from 'zustand';
import type { AppView, UserProfile } from '@/types';

interface AppState {
  // ---- SPA view routing ----
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // ---- Authentication state ----
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoadingAuth: boolean;
  setLoadingAuth: (loading: boolean) => void;

  // ---- Admin sidebar toggle ----
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Default view is the public portal
  currentView: 'portal',
  setCurrentView: (view) => set({ currentView: view }),

  // No authenticated user initially; auth loading in progress
  user: null,
  setUser: (user) => set({ user }),
  isLoadingAuth: true,
  setLoadingAuth: (loading) => set({ isLoadingAuth: loading }),

  // Sidebar starts open on desktop
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
