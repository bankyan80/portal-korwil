'use client'

import { Home, School, Baby, GraduationCap, BarChart3, FileText, Users, WalletMinimal, Database, BookOpen, Target, CalendarDays, FolderOpen, Mail, Send, Globe, Phone, Clock, HeartHandshake, Megaphone, Sparkles, type LucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'
import { useDataStore } from '@/store/data-store'
import { cn } from '@/lib/utils'

const iconMap: Record<string, LucideIcon> = {
  Home, School, Baby, GraduationCap, BarChart3,
  FileText, Users, WalletMinimal, Database,
  BookOpen, Target, CalendarDays, FolderOpen,
  Mail, Send, Globe, Phone, Clock,
  HeartHandshake, Megaphone,
}

const FALLBACK_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'data', label: 'Data', icon: Database, path: '/master-data' },
  { id: 'rekap', label: 'Rekap', icon: BarChart3, path: '/rekap-laporan' },
  { id: 'haloai', label: 'HaloAI', icon: Sparkles, path: '' },
  { id: 'profil', label: 'Profil', icon: Users, path: '/profil' },
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

    setCurrentView('portal')
    router.push(item.path)
  }

  const isActive = (item: typeof navItems[0]) => {
    if (item.path === '/') return pathname === '/'
    if (!item.path) return false
    return pathname?.startsWith(item.path) || false
  }

  return null;
}
