'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { AdminSidebar } from './AdminSidebar';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Sun, Moon } from 'lucide-react';
import { VIEW_TITLES } from '@/lib/navigation';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

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
                <h1 className="text-lg font-semibold text-white">
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
         <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
       </div>
     </div>
   );
}
