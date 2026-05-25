'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import {
  doc, getDoc, setDoc, collection, query, limit, getDocs,
  getCountFromServer,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { UserProfile, UserRole } from '@/types';

const SUPER_ADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS.split(',').map(email => email.trim())
  : [];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoadingAuth } = useAppStore();

  useEffect(() => {
    if (!auth || !db) {
      setLoadingAuth(false);
      return;
    }

    const firestore = db as Firestore;
    const firebaseAuth = auth as Auth;

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Set auth-token cookie for API route protection
          const token = await getIdToken(firebaseUser);
          const secureCookie = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `auth-token=${token}; path=/; max-age=3600; SameSite=Lax${secureCookie}`;

          let userProfile: UserProfile | null = null;
          let isOffline = false;

          // Try read from Firestore users collection
          try {
            const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              userProfile = userDoc.data() as UserProfile;
              const email = firebaseUser.email || '';
              if (SUPER_ADMIN_EMAILS.includes(email) && userProfile.role !== 'super_admin') {
                const updated = { ...userProfile, role: 'super_admin' as const, updatedAt: Date.now() };
                try { await setDoc(doc(firestore, 'users', firebaseUser.uid), updated); } catch {}
                userProfile = updated;
              }
            }
          } catch (err: any) {
            const msg = (err?.message || '').toLowerCase();
            if (msg.includes('offline') || msg.includes('network') || err?.code === 'unavailable') {
              isOffline = true;
            }
          }

          if (!userProfile) {
            // Firestore unreachable or user doc doesn't exist — build from email
            const email = firebaseUser.email || '';
            const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(email);
            userProfile = {
              uid: firebaseUser.uid,
              email,
              displayName: firebaseUser.displayName || email.split('@')[0],
              role: isSuperAdminEmail ? 'super_admin' : (isOffline ? 'publik' : 'publik'),
              isActive: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            // Try to write back to Firestore only when NOT offline
            if (!isOffline) {
              try {
                if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
                  const q = query(collection(firestore, 'users'), limit(1));
                  const allUsersSnapshot = await getDocs(q);
                  if (userProfile?.role !== 'super_admin' && allUsersSnapshot.empty) {
                    userProfile = { ...userProfile, role: 'super_admin' as const };
                  }
                }
                await setDoc(doc(firestore, 'users', firebaseUser.uid), userProfile as UserProfile);
              } catch {}
            }
          }

          setUser(userProfile);
        } catch (error) {
          console.error('Error in AuthProvider:', error);
          // Final fallback: still set user so the app doesn't hang forever
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: 'publik',
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      } else {
        document.cookie = 'auth-token=; path=/; max-age=0';
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoadingAuth]);

  return <>{children}</>;
}
