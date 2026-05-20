'use client'

import { Lock, ShieldCheck, GraduationCap, MessageCircle, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type AccessStatus = 'not-logged-in' | 'no-access' | 'not-activated' | 'wrong-role'

interface AccessValidationProps {
  status: AccessStatus
  userEmail?: string
  userRole?: string
  schoolName?: string
  requiredRole?: string
  featureName?: string
  className?: string
}

const WA_ADMIN = 'https://wa.me/6281321592990?text=Halo%20Admin,%20email%20saya%20belum%20memiliki%20akses%20Laporan%20Bulanan.'

export default function AccessValidation({
  status,
  userEmail,
  userRole,
  schoolName,
  requiredRole,
  featureName = 'Laporan Bulanan',
  className,
}: AccessValidationProps) {
  const router = useRouter()

  const config = {
    'not-logged-in': {
      icon: Lock,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      border: 'border-amber-200 dark:border-amber-800/50',
      title: 'Akses Terbatas',
      message: `Untuk membuka menu ${featureName}, silakan login terlebih dahulu menggunakan akun resmi operator sekolah.`,
      action: 'login',
    },
    'no-access': {
      icon: ShieldCheck,
      color: 'from-red-500 to-rose-500',
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800/50',
      title: 'Belum Memiliki Akses',
      message: `Email Anda sudah login tetapi belum memiliki hak akses ke menu ${featureName}.\n\nSilakan hubungi admin untuk aktivasi akses operator sekolah.`,
      action: 'contact',
    },
    'not-activated': {
      icon: ShieldCheck,
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      border: 'border-orange-200 dark:border-orange-800/50',
      title: 'Akun Belum Diaktifkan',
      message: `Akun Anda (${userEmail}) terdaftar tetapi belum diaktifkan oleh admin untuk mengakses ${featureName}.\n\nSilakan hubungi admin untuk proses aktivasi.`,
      action: 'contact',
    },
    'wrong-role': {
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-500',
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800/50',
      title: 'Role Tidak Sesuai',
      message: `Role Anda saat ini: ${userRole || '-'}. Untuk mengakses ${featureName}, diperlukan role: ${requiredRole || 'operator_sekolah'}.`,
      action: 'contact',
    },
  }

  const c = config[status]
  const Icon = c.icon

  const handleLogin = () => {
    const callbackUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/admin/operator'
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return (
    <div className={cn('min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900', className)}>
      <div className="w-full max-w-md">
        <div className={cn(
          'rounded-2xl border shadow-lg overflow-hidden backdrop-blur-sm',
          c.bg,
          c.border
        )}>
          <div className={cn('bg-gradient-to-r px-6 py-5', c.color)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{c.title}</h2>
                <p className="text-xs text-white/80">Portal Pendidikan Kecamatan Lemahabang</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{c.message}</p>

                {userEmail && status !== 'not-logged-in' && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="truncate">{userEmail}</span>
                  </div>
                )}

                {schoolName && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span className="truncate">{schoolName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {c.action === 'login' && (
                <button
                  onClick={handleLogin}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]"
                >
                  <LogIn className="w-4 h-4" />
                  Login Sekarang
                </button>
              )}

              {c.action === 'contact' && (
                <a
                  href={WA_ADMIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-md shadow-green-500/20 active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Hubungi Admin
                </a>
              )}

              <button
                onClick={() => router.push('/')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-4">
          Portal Pendidikan Kecamatan Lemahabang &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
