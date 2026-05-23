'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import AccessValidation from './AccessValidation'
import { Loader2 } from 'lucide-react'

type UserRole = 'super_admin' | 'operator_sekolah' | 'ketua_organisasi' | 'publik'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requireActive?: boolean
  requireSchool?: boolean
  featureName?: string
}

export default function AuthGuard({
  children,
  requiredRoles = ['operator_sekolah', 'super_admin'],
  requireActive = true,
  requireSchool = false,
  featureName = 'Laporan Bulanan',
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAppStore((s) => s.user)
  const isLoadingAuth = useAppStore((s) => s.isLoadingAuth)
  const [validated, setValidated] = useState(false)
  const [accessStatus, setAccessStatus] = useState<'checking' | 'granted' | 'not-logged-in' | 'no-access' | 'not-activated' | 'wrong-role'>('checking')

  useEffect(() => {
    if (isLoadingAuth) return

    if (!user) {
      const callbackUrl = pathname + (typeof window !== 'undefined' ? window.location.search : '')
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    if (requireActive && user.isActive === false) {
      setAccessStatus('not-activated')
      setValidated(true)
      return
    }

    if (!requiredRoles.includes(user.role as UserRole)) {
      setAccessStatus('wrong-role')
      setValidated(true)
      return
    }

    if (requireSchool && !user.schoolId && !user.schoolName) {
      setAccessStatus('no-access')
      setValidated(true)
      return
    }

    setAccessStatus('granted')
    setValidated(true)
  }, [user, isLoadingAuth, requiredRoles, requireActive, requireSchool, router, pathname])

  if (accessStatus === 'checking' || !validated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memeriksa akses...</p>
        </div>
      </div>
    )
  }

  if (accessStatus === 'granted') {
    return <>{children}</>
  }

  if (accessStatus === 'not-activated') {
    return (
      <AccessValidation
        status="not-activated"
        userEmail={user?.email}
        schoolName={user?.schoolName}
        featureName={featureName}
      />
    )
  }

  if (accessStatus === 'wrong-role') {
    return (
      <AccessValidation
        status="wrong-role"
        userEmail={user?.email}
        userRole={user?.role}
        requiredRole={requiredRoles.join(' / ')}
        schoolName={user?.schoolName}
        featureName={featureName}
      />
    )
  }

  if (accessStatus === 'no-access') {
    return (
      <AccessValidation
        status="no-access"
        userEmail={user?.email}
        schoolName={user?.schoolName}
        featureName={featureName}
      />
    )
  }

  return null
}

export function useAuthGuard(
  requiredRoles: UserRole[] = ['operator_sekolah', 'super_admin'],
  options?: { requireActive?: boolean; requireSchool?: boolean; featureName?: string }
) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAppStore((s) => s.user)
  const isLoadingAuth = useAppStore((s) => s.isLoadingAuth)

  useEffect(() => {
    if (isLoadingAuth) return

    if (!user) {
      const callbackUrl = pathname + (typeof window !== 'undefined' ? window.location.search : '')
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    if (options?.requireActive && user.isActive === false) {
      router.replace('/admin/operator')
      return
    }

    if (!requiredRoles.includes(user.role as UserRole)) {
      router.replace(getDashboardRoute(user.role))
      return
    }

    if (options?.requireSchool && !user.schoolId && !user.schoolName) {
      router.replace('/admin/operator')
      return
    }
  }, [user, isLoadingAuth, requiredRoles, router, pathname, options])

  return {
    isAuthorized: !isLoadingAuth && user && requiredRoles.includes(user.role as UserRole),
    isLoading: isLoadingAuth,
    user,
  }
}

function getDashboardRoute(role: string): string {
  switch (role) {
    case 'super_admin': return '/admin/super'
    case 'operator_sekolah': return '/admin/operator'
    case 'ketua_organisasi': return '/admin/organisasi'
    default: return '/login'
  }
}
