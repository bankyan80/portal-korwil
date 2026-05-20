'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import HaloAIButton from './HaloAIButton';
import HaloAIChat from './HaloAIChat';
import { useAppStore } from '@/store/app-store';

type AIStatus = 'online' | 'slow' | 'error' | 'checking';

export default function HaloAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus>('checking');
  const user = useAppStore((s) => s.user);
  const currentView = useAppStore((s) => s.currentView);
  const pathname = usePathname();

  useEffect(() => {
    const check = async () => {
      setAiStatus('checking');
      try {
        const res = await fetch('/api/haloai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'ping',
            history: [],
            context: { userRole: 'publik', userName: 'System', currentPath: '/', currentView: 'portal' },
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAiStatus('online');
        } else {
          setAiStatus('error');
        }
      } catch {
        setAiStatus('error');
      }
    };
    check();
    const interval = setInterval(check, 60000);
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

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleAiStatusChange = useCallback((status: AIStatus) => {
    setAiStatus(status);
  }, []);

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-black/20 border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <HaloAIChat onClose={handleClose} context={context} onAiStatusChange={handleAiStatusChange} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <HaloAIButton isOpen={isOpen} onToggle={handleToggle} />
        </motion.div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/10 backdrop-blur-[1px] md:hidden"
          onClick={handleClose}
        />
      )}
    </>
  );
}
