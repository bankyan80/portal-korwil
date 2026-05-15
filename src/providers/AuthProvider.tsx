'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import type { UserProfile, UserRole } from '@/types';

const SUPER_ADMIN_EMAILS = ['yanuarhidayat80@gmail.com'];

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
            const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const existing = userDoc.data() as UserProfile;
              const email = firebaseUser.email || '';
              if (SUPER_ADMIN_EMAILS.includes(email) && existing.role !== 'super_admin') {
                const updated = { ...existing, role: 'super_admin' as const, updatedAt: Date.now() };
                await setDoc(doc(firestore, 'users', firebaseUser.uid), updated);
                setUser(updated);
              } else {
                setUser(existing);
              }
            } else {
              const email = firebaseUser.email || '';
              const isSuperAdminEmail = SUPER_ADMIN_EMAILS.includes(email);

              let role: UserRole = 'publik';
              if (isSuperAdminEmail) {
                role = 'super_admin';
              } else {
                const q = query(collection(firestore, 'users'), limit(1));
                const allUsersSnapshot = await getDocs(q);
                const isFirstUser = allUsersSnapshot.empty;
                role = isFirstUser ? 'super_admin' : 'publik';
              }

              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email,
                displayName: firebaseUser.displayName || '',
                role,
                isActive: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
             await setDoc(doc(firestore, 'users', firebaseUser.uid), newProfile);
             setUser(newProfile);
           }
         } catch (error) {
           console.error('Error fetching user profile:', error);
         }
       } else {
         setUser(null);
       }
        setLoadingAuth(false);
      });

    return () => unsubscribe();
  }, [setUser, setLoadingAuth]);

  return <>{children}</>;
}
