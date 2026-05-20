'use client'

import { Home, Database, BarChart3, Sparkles, User } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  path: string
  requiresAuth?: boolean
  allowedRoles?: string[]
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'data', label: 'Data', icon: Database, path: '/data-sekolah' },
  { id: 'rekap', label: 'Rekap', icon: BarChart3, path: '/rekap-laporan' },
  { id: 'haloai', label: 'HaloAI', icon: Sparkles, path: '/haloai' },
  { id: 'profil', label: 'Profil', icon: User, path: '/profil' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAppStore((s) => s.user)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  const isActive = (item: NavItem) => {
    if (item.path === '/') return pathname === '/'
    return pathname?.startsWith(item.path) || false
  }

  const handleNav = (item: NavItem) => {
    if (item.id === 'haloai') {
      window.dispatchEvent(new CustomEvent('haloai:toggle'))
      return
    }

    if (item.requiresAuth && !user) {
      router.push('/login')
      return
    }

    if (item.allowedRoles && user && !item.allowedRoles.includes(user.role)) {
      return
    }

    setCurrentView(item.path === '/' ? 'portal' : item.path.replace('/', '') as any)
    router.push(item.path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-slate-700/50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[56px]',
                  active
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                <div className={cn(
                  'relative p-1.5 rounded-xl transition-all duration-200',
                  active && 'bg-blue-100 dark:bg-blue-900/40'
                )}>
                  <Icon className="w-5 h-5" />
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] font-medium mt-0.5',
                  active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
