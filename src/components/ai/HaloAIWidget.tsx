'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import HaloAIChat from './HaloAIChat'
import { useAppStore } from '@/store/app-store'
import { GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'
import { useIsDesktop } from '@/hooks/use-media-query'

type AIStatus = 'online' | 'slow' | 'error' | 'checking'

export default function HaloAIWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [aiStatus, setAiStatus] = useState<AIStatus>('checking')
  const user = useAppStore((s) => s.user)
  const currentView = useAppStore((s) => s.currentView)
  const pathname = usePathname()
  const isDesktop = useIsDesktop()

  useEffect(() => {
    let failCount = 0
    let isOffline = false

    const check = async () => {
      try {
        const res = await fetch('/api/haloai', { method: 'GET' })
        const data = await res.json()
        isOffline = !data.ok
        failCount = data.ok ? 0 : failCount + 1
        setAiStatus(data.ok ? 'online' : 'error')
      } catch {
        failCount++
        isOffline = failCount > 2
        if (failCount > 2) {
          setAiStatus('error')
        }
      }
    }

    check()
    const interval = setInterval(check, 120000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev)
    window.addEventListener('haloai:toggle', handleToggle)
    return () => window.removeEventListener('haloai:toggle', handleToggle)
  }, [])

  const context = {
    userRole: user?.role || 'publik',
    userName: user?.displayName || 'Pengunjung',
    schoolName: user?.schoolName,
    schoolId: user?.schoolId,
    currentPath: pathname || '/',
    currentView,
  }

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleAiStatusChange = useCallback((status: AIStatus) => {
    setAiStatus(status)
  }, [])

  if (pathname?.startsWith('/login')) return null;

  return (
    <div className="no-print">
      {isDesktop ? (
        <DesktopPanel
          isOpen={isOpen}
          onToggle={handleToggle}
          context={context}
          aiStatus={aiStatus}
          onAiStatusChange={handleAiStatusChange}
        />
      ) : (
        <MobileSheet
          isOpen={isOpen}
          onClose={handleToggle}
          context={context}
          aiStatus={aiStatus}
          onAiStatusChange={handleAiStatusChange}
        />
      )}
    </div>
  )
}

function DesktopPanel({
  isOpen,
  onToggle,
  context,
  aiStatus,
  onAiStatusChange,
}: {
  isOpen: boolean
  onToggle: () => void
  context: any
  aiStatus: AIStatus
  onAiStatusChange: (status: AIStatus) => void
}) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 z-50 h-screen w-[400px] bg-white dark:bg-slate-800 shadow-2xl shadow-black/20 border-l border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden"
          >
            <HaloAIChat onClose={onToggle} context={context} aiStatus={aiStatus} onAiStatusChange={onAiStatusChange} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={false}
        animate={{ x: isOpen ? 0 : 0 }}
        className="fixed top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 px-2 py-4 rounded-l-xl shadow-lg transition-all duration-300 bg-gradient-to-b from-blue-700 to-blue-900 text-white"
        style={{ right: isOpen ? '400px' : '0' }}
        onClick={onToggle}
      >
        <GraduationCap className="w-5 h-5" />
        {!isOpen && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            className="text-xs font-semibold whitespace-nowrap pr-1"
          >
            HaloAI
          </motion.span>
        )}
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </motion.button>
    </>
  )
}

function MobileSheet({
  isOpen,
  onClose,
  context,
  aiStatus,
  onAiStatusChange,
}: {
  isOpen: boolean
  onClose: () => void
  context: any
  aiStatus: AIStatus
  onAiStatusChange: (status: AIStatus) => void
}) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed bottom-0 left-0 right-0 z-50 h-[90vh] bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl flex flex-col md:hidden overflow-hidden"
            >
              <HaloAIChat onClose={onClose} context={context} aiStatus={aiStatus} onAiStatusChange={onAiStatusChange} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center md:hidden"
        onClick={onClose}
      >
        <GraduationCap className="w-6 h-6" />
        {aiStatus === 'online' && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </motion.button>
    </>
  )
}
