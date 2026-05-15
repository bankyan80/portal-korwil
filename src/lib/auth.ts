import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import type { UserProfile, UserRole } from '@/types';

export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'super_admin': return '/admin/super';
    case 'ketua_organisasi': return '/admin/organisasi';
    case 'operator_sekolah': return '/admin/operator';
    default: return '/';
  }
}

export function getRoleLabel(role: UserRole | undefined): string {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'ketua_organisasi': return 'Ketua Organisasi';
    case 'operator_sekolah': return 'Operator Sekolah';
    case 'publik': return 'Publik';
    default: return '-';
  }
}

export function watchAuthUser(callback: (user: UserProfile | null) => void): () => void {
  if (!auth || !db) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth!, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    try {
      const docRef = doc(db!, 'users', firebaseUser.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    } catch {
      callback(null);
    }
  });
}
