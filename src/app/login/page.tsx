'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAppStore } from '@/store/app-store';
import { getAdminDashboardRoute } from '@/lib/permissions';
import type { UserRole, UserProfile } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'publik') {
      router.push(getAdminDashboardRoute(user.role));
    }
  }, [user, router]);

  async function handleGoogleLogin() {
    if (!auth || !db) {
      setError('Firebase tidak dikonfigurasi. Hubungi administrator.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      let profile: UserProfile;

      if (userDoc.exists()) {
        profile = userDoc.data() as UserProfile;
        await setDoc(userDocRef, { lastLogin: Date.now() }, { merge: true });
      } else {
        const email = firebaseUser.email || '';
        const SUPER_ADMIN_EMAILS = ['yanuarhidayat80@gmail.com'];
        const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);
        const role: UserRole = isSuperAdmin ? 'super_admin' : 'publik';

        if (!isSuperAdmin) {
          setError('Email Anda tidak terdaftar. Hubungi administrator.');
          setLoading(false);
          return;
        }

        profile = {
          uid: firebaseUser.uid,
          email,
          displayName: firebaseUser.displayName || '',
          role,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await setDoc(userDocRef, profile);
      }

      setUser(profile);
      router.push(getAdminDashboardRoute(profile.role));
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login dibatalkan');
      } else {
        setError(err.message || 'Gagal login');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-800 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">PK</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Portal Kedinasan
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kecamatan Lemahabang
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {loading ? 'Memproses...' : 'LOGIN DENGAN GOOGLE'}
            </span>
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-lg px-3 py-2 text-center">
              {error}
            </p>
          )}

          <p className="mt-6 text-xs text-center text-muted-foreground">
            Hanya untuk pengguna terdaftar. Hubungi administrator untuk akses.
          </p>
        </div>
      </div>
    </div>
  );
}
