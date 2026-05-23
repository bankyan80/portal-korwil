'use client';

import { useAppStore } from '@/store/app-store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { VIEW_TITLES } from '@/lib/navigation';
import { FirebaseLED } from '@/components/portal/FirebaseLED';

export function SimpleAdminLayout({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView } = useAppStore();
  const { theme, setTheme } = useTheme();

  const handleBack = () => {
    setCurrentView('portal');
    window.location.assign('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-900 overflow-hidden">
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 lg:px-6 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-white/80 hover:text-white hover:bg-white/10 gap-2 px-2 h-9"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">Kembali</span>
            </Button>

            <div className="w-px h-6 bg-white/20 hidden sm:block mx-1" />

            <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[200px] sm:max-w-none">
              {VIEW_TITLES[currentView] || 'Admin Panel'}
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Ganti tema"
            className="text-white hover:bg-white/10"
          >
            <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto w-full max-w-7xl mx-auto">
        {children}
      </main>
      
      <FirebaseLED />
    </div>
  );
}
