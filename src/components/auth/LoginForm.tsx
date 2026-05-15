'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '@/store/app-store';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const firebaseErrors: Record<string, string> = {
  'auth/invalid-credential': 'Email atau password salah. Silakan coba lagi.',
  'auth/user-not-found': 'Akun tidak ditemukan. Silakan periksa email Anda.',
  'auth/wrong-password': 'Password salah. Silakan coba lagi.',
  'auth/too-many-requests': 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/network-request-failed': 'Koneksi internet terputus. Silakan coba lagi.',
  'auth/popup-closed-by-user': 'Login Google dibatalkan.',
  'auth/cancelled-popup-request': 'Login dibatalkan.',
  'auth/popup-blocked': 'Popup diblokir oleh browser. Silakan izinkan popup.',
  'auth/unauthorized-domain': 'Domain tidak diizinkan. Pastikan domain sudah ditambahkan di Firebase Console.',
  'auth/operation-not-allowed': 'Google Sign-In belum diaktifkan. Silakan hubungi administrator.',
};

async function getOrCreateUserProfile(uid: string, email: string, displayName: string | null): Promise<UserProfile> {
  if (!db) {
    return {
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      role: 'viewer',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  const newUser: UserProfile = {
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    role: 'viewer',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(userRef, newUser);
  return newUser;
}

export function LoginForm() {
  const { setUser, setCurrentView } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (!auth) {
        setError('Firebase belum dikonfigurasi. Hubungi administrator.');
        return;
      }
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        const profile = await getOrCreateUserProfile(
          userCredential.user.uid,
          userCredential.user.email || data.email,
          userCredential.user.displayName
        );
        setUser(profile);
        toast.success('Login berhasil!', { description: `Selamat datang, ${profile.displayName}` });
        setCurrentView('portal');
      }
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      console.error('Login error:', fbErr);
      setError(firebaseErrors[fbErr.code || ''] || 'Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      if (!auth) {
        setError('Firebase belum dikonfigurasi. Hubungi administrator.');
        return;
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        const profile = await getOrCreateUserProfile(
          result.user.uid,
          result.user.email || '',
          result.user.displayName
        );
        setUser(profile);
        toast.success('Login Google berhasil!', { description: `Selamat datang, ${profile.displayName}` });
        setCurrentView('portal');
      }
     } catch (err: unknown) {
       const fbErr = err as { code?: string; message?: string };
       console.error('Google login error:', fbErr);

       if (fbErr.code === 'auth/popup-closed-by-user' || fbErr.code === 'auth/cancelled-popup-request') {
       } else if (fbErr.code === 'auth/operation-not-allowed') {
         setError('Google Sign-In belum diaktifkan di Firebase Console. Silakan hubungi administrator untuk mengaktifkannya.');
       } else if (fbErr.code === 'auth/unauthorized-domain') {
         setError('Domain ini tidak diizinkan. Silakan tambahkan domain di Firebase Console → Authentication → Settings → Authorized domains.');
       } else if (fbErr.code === 'auth/popup-blocked') {
         setError('Popup login diblokir oleh browser. Silakan izinkan popup untuk situs ini.');
       } else {
         const errorMsg = firebaseErrors[fbErr.code || ''] || fbErr.message || 'Gagal login dengan Google.';
         setError(`${errorMsg} (Error: ${fbErr.code || 'unknown'})`);
       }
     } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-800 to-blue-900 px-6 py-8 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/portalnew.png"
              alt="Logo Portal Pendidikan"
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Pendidikan</h1>
          <p className="text-blue-200 text-sm mt-1">Kecamatan Lemahabang</p>
          <p className="text-blue-300 text-xs mt-1">Kabupaten Cirebon, Jawa Barat</p>
        </div>
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-xl text-center text-gray-800">Masuk ke Sistem</CardTitle>
          <CardDescription className="text-center text-gray-500">Gunakan akun yang telah terdaftar untuk mengakses portal</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isSubmitting}
            className="w-full h-11 bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 transition-colors cursor-pointer mb-4"
          >
            {isGoogleLoading ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-800 border-t-transparent rounded-full animate-spin" />Memproses...</span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Masuk dengan Google
              </span>
            )}
          </Button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Alamat Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" placeholder="contoh@lemahabang.sch.id" autoComplete="email" disabled={isSubmitting || isGoogleLoading} className="pl-10 h-11" {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" autoComplete="current-password" disabled={isSubmitting || isGoogleLoading} className="pl-10 pr-10 h-11" {...register('password')} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting || isGoogleLoading} className="w-full h-11 bg-blue-800 hover:bg-blue-900 text-white font-semibold transition-colors cursor-pointer">
              {isSubmitting ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Memproses...</span>
              ) : (
                <span className="flex items-center gap-2"><LogIn className="w-4 h-4" />Masuk</span>
              )}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button type="button" onClick={() => setCurrentView('portal')} className="text-sm text-blue-800 hover:text-blue-600 hover:underline transition-colors cursor-pointer">
              &larr; Kembali ke Portal
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
