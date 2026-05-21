'use client'

import { Home, Sparkles, type LucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { useDataStore } from '@/store/data-store'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  Home, School: Home, Baby: Home, GraduationCap: Home, BarChart3: Home,
  FileText: Home, Users: Home, WalletMinimal: Home, Database: Home,
  BookOpen: Home, Target: Home, CalendarDays: Home, FolderOpen: Home,
  Mail: Home, Send: Home, Globe: Home, Phone: Home, Clock: Home,
  HeartHandshake: Home, Megaphone: Home,
}

const FALLBACK_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'data', label: 'Data', icon: Home, path: '/data-gtk' },
  { id: 'rekap', label: 'Rekap', icon: Home, path: '/rekap-laporan' },
  { id: 'haloai', label: 'HaloAI', icon: Sparkles, path: '' },
  { id: 'profil', label: 'Profil', icon: Home, path: '/profil' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAppStore((s) => s.user)
  const setCurrentView = useAppStore((s) => s.setCurrentView)
  const firestoreMenus = useDataStore((s) => s.menus)

  const navItems = firestoreMenus.length > 0
    ? firestoreMenus
        .filter((m) => m.active && m.url && m.url !== '#')
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        .slice(0, 5)
        .map((m) => ({
          id: m.id,
          label: m.title,
          icon: iconMap[m.icon] || Home,
          path: m.url.startsWith('http') ? '' : m.url,
          isExternal: m.url.startsWith('http'),
        }))
    : FALLBACK_ITEMS

  const handleNav = (item: typeof navItems[0]) => {
    if ('isExternal' in item && item.isExternal) {
      window.open((item as any).path || '', '_blank', 'noopener,noreferrer')
      return
    }

    if (item.id === 'haloai' || item.label === 'HaloAI') {
      window.dispatchEvent(new CustomEvent('haloai:toggle'))
      return
    }

    if (item.path === '/' || !item.path) {
      setCurrentView('portal')
      router.push('/')
      return
    }

    setCurrentView(item.path.replace('/', '') as any)
    router.push(item.path)
  }

  const isActive = (item: typeof navItems[0]) => {
    if (item.path === '/') return pathname === '/'
    if (!item.path) return false
    return pathname?.startsWith(item.path) || false
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
