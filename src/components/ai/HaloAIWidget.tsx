'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import HaloAIChat from './HaloAIChat';
import { useAppStore } from '@/store/app-store';
import { GraduationCap, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

type AIStatus = 'online' | 'slow' | 'error' | 'checking';

export default function HaloAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>('checking');
  const user = useAppStore((s) => s.user);
  const currentView = useAppStore((s) => s.currentView);
  const pathname = usePathname();

  useEffect(() => {
    let failCount = 0;
    let isOffline = false;

    const check = async () => {
      try {
        const res = await fetch('/api/haloai', { method: 'GET' });
        const data = await res.json();
        isOffline = !data.ok;
        failCount = data.ok ? 0 : failCount + 1;
        setAiStatus(data.ok ? 'online' : 'error');
      } catch {
        failCount++;
        isOffline = failCount > 2;
        if (failCount > 2) {
          setAiStatus('error');
        }
      }
    };

    check();
    const interval = setInterval(check, 120000);
    return () => clearInterval(interval);
  }, []);

  const context = {
    userRole: user?.role || 'publik',
    userName: user?.displayName || 'Pengunjung',
    schoolName: user?.schoolName,
    schoolId: user?.schoolId,
    currentPath: pathname || '/',
    currentView,
  };

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleAiStatusChange = useCallback((status: AIStatus) => {
    setAiStatus(status);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed top-0 right-0 z-50 h-screen w-[400px] bg-white dark:bg-slate-800 shadow-2xl shadow-black/20 border-l border-gray-200 dark:border-slate-700 flex flex-col"
          >
            <HaloAIChat onClose={handleToggle} context={context} aiStatus={aiStatus} onAiStatusChange={handleAiStatusChange} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={false}
        animate={{ x: isOpen ? 0 : 0 }}
        className={`fixed top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 px-2 py-4 rounded-l-xl shadow-lg transition-all duration-300 ${
          isOpen
            ? 'right-[400px] bg-gradient-to-b from-blue-700 to-blue-900 text-white'
            : 'right-0 bg-gradient-to-b from-blue-700 to-blue-900 text-white rounded-l-xl rounded-r-none'
        }`}
        onClick={handleToggle}
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
        {isOpen ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </motion.button>
    </>
  );
}
