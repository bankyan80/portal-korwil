'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { AdminSidebar } from './AdminSidebar';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Sun, Moon, ArrowLeft, RefreshCw } from 'lucide-react';
import { VIEW_TITLES } from '@/lib/navigation';
import { FirebaseLED } from '@/components/portal/FirebaseLED';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentView, setCurrentView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleBack = () => {
    setCurrentView('portal');
    window.location.assign('/');
  };

   return (
     <div className="h-screen flex bg-slate-50 dark:bg-gray-900 overflow-hidden">
       <div className="hidden lg:flex lg:shrink-0 h-full">
         <AdminSidebar />
       </div>
       <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
         <header className="sticky top-0 z-40 bg-gradient-to-b from-[#1a5276] to-[#0d3b66] px-4 lg:px-6 py-3 shrink-0">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
                      <Menu className="w-5 h-5" />
                     <span className="sr-only">Buka menu</span>
                   </Button>
                 </SheetTrigger>
                 <SheetContent side="left" className="p-0 w-64 h-full">
                   <SheetTitle className="sr-only">Menu Admin</SheetTitle>
                   <AdminSidebar onNavigate={() => setMobileOpen(false)} />
                 </SheetContent>
               </Sheet>
               
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBack}
                  className="text-white/80 hover:text-white hover:bg-white/10 gap-2 px-2 h-9"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-medium">Dashboard Publik</span>
                </Button>

                <div className="w-px h-6 bg-white/20 hidden sm:block mx-1" />

                <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[150px] sm:max-w-none">
                  {VIEW_TITLES[currentView] || 'Admin Panel'}
              </h1>
              </div>
              <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
                aria-label="Refresh"
                className="text-white hover:bg-white/10"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
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
            </div>
          </header>
         <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
        </div>
        <FirebaseLED />
      </div>
   );
}
