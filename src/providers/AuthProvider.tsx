'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, onIdTokenChanged, getIdToken } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import type { UserProfile } from '@/types';

const SUPER_ADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS.split(',').map(email => email.trim())
  : [];

function parseJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
    return JSON.parse(atob(padded));
  } catch { return null; }
}

function setAuthCookie(token: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `auth-token=${token}; path=/; max-age=3600; SameSite=Lax${secure}`;
}

function clearAuthCookie() {
  document.cookie = 'auth-token=; path=/; max-age=0';
}

async function apiGetUser(uid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/firestore/users?id=${encodeURIComponent(uid)}`);
    const json = await res.json();
    if (json.exists && json.data) return json.data as UserProfile;
  } catch {}
  return null;
}

async function apiSetUser(uid: string, data: Record<string, any>) {
  try {
    const res = await fetch('/api/firestore/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: uid, data, merge: true }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      console.warn('[apiSetUser] Gagal menyimpan profil:', json.error || res.status);
    }
  } catch (e) {
    console.warn('[apiSetUser] Network error:', e);
  }
}

async function apiGetFirstUser(): Promise<boolean> {
  try {
    const res = await fetch('/api/firestore/users?limit=1');
    const json = await res.json();
    return (json.items || []).length === 0;
  } catch { return true; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoadingAuth } = useAppStore();

  useEffect(() => {
    if (!auth) {
      const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
      if (match) {
        if (match[1].startsWith('npsn:')) {
          fetch('/api/auth/verify-session').then(async (res) => {
            if (res.ok) {
              const json = await res.json();
              if (json.valid && json.profile) {
                setUser(json.profile);
              }
            }
          }).catch(() => {}).finally(() => setLoadingAuth(false));
          return;
        }
        const payload = parseJwtPayload(match[1]);
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          setUser({
            uid: payload.user_id || payload.uid || '',
            email: payload.email || '',
            displayName: payload.name || payload.email?.split('@')[0] || '',
            role: payload.role || 'publik',
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
      setLoadingAuth(false);
      return;
    }

    const firebaseAuth = auth as Auth;

    const unsubscribeToken = onIdTokenChanged(firebaseAuth, async (user) => {
      if (user) {
        const token = await getIdToken(user);
        setAuthCookie(token);
      }
    });

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      // Prefer NPSN session over Firebase Auth
      const npsnMatch = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
      const hasNpsnSession = npsnMatch && npsnMatch[1].startsWith('npsn:');

      if (firebaseUser && hasNpsnSession) {
        const res = await fetch('/api/auth/verify-session');
        if (res.ok) {
          const json = await res.json();
          if (json.valid && json.profile) {
            setUser(json.profile);
            setLoadingAuth(false);
            return;
          }
        }
      }

      if (firebaseUser) {
        try {
          const token = await getIdToken(firebaseUser);
          setAuthCookie(token);

          let userProfile = await apiGetUser(firebaseUser.uid);

          if (userProfile) {
            const email = firebaseUser.email || '';
            if (SUPER_ADMIN_EMAILS.includes(email) && userProfile.role !== 'super_admin') {
              userProfile = { ...userProfile, role: 'super_admin' as const, updatedAt: Date.now() };
              await apiSetUser(firebaseUser.uid, userProfile);
            }
          } else {
            const email = firebaseUser.email || '';
            const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(email);
            const isFirstUser = process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'
              ? await apiGetFirstUser()
              : false;
            const role = isSuperAdminEmail ? 'super_admin' : (isFirstUser ? 'super_admin' : 'publik');
            userProfile = {
              uid: firebaseUser.uid,
              email,
              displayName: firebaseUser.displayName || email.split('@')[0],
              role,
              isActive: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await apiSetUser(firebaseUser.uid, userProfile);
          }

          setUser(userProfile);
          setLoadingAuth(false);
        } catch (error) {
          console.error('Error in AuthProvider:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: 'publik',
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          setLoadingAuth(false);
        }
      } else {
        const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
        if (match && match[1].startsWith('npsn:')) {
          try {
            const res = await fetch('/api/auth/verify-session');
            if (res.ok) {
              const json = await res.json();
              if (json.valid && json.profile) {
                setUser(json.profile);
                setLoadingAuth(false);
                return;
              }
            }
          } catch {
            console.warn('[AuthProvider] Gagal verifikasi sesi NPSN');
          }
          // NPSN cookie exists but verify failed (e.g. network glitch)
          // Don't clear cookie — allow retry on next page load
          setUser(null);
          setLoadingAuth(false);
          return;
        }
        clearAuthCookie();
        setUser(null);
        setLoadingAuth(false);
      }
    });

    return () => { unsubscribe(); unsubscribeToken(); };
  }, [setUser, setLoadingAuth]);

  return <>{children}</>;
}
