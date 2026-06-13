'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/app-store';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChangePasswordDialog } from '@/components/operator/ChangePasswordDialog';
import { Sun, Moon, ArrowLeft, RefreshCw, User, KeyRound, LogOut } from 'lucide-react';

export function SimpleAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, setUser, setCurrentView } = useAppStore();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleBack = () => {
    if (pathname === '/admin/operator') {
      window.location.assign('/');
    } else {
      window.location.assign('/admin/operator');
    }
  };

  const handleLogout = async () => {
    document.cookie = 'auth-token=; path=/; max-age=0';
    if (auth) { try { await signOut(auth); } catch {} }
    setUser(null);
    setCurrentView('portal');
    window.location.href = '/';
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
              <span className="hidden sm:inline text-xs font-medium">
                {pathname === '/admin/operator' ? 'Dashboard Publik' : 'Beranda'}
              </span>
            </Button>

            <div className="w-px h-6 bg-white/20 hidden sm:block mx-1" />

            <h1 className="text-sm sm:text-base font-semibold text-white truncate max-w-[200px] sm:max-w-none">
              Admin Panel
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

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b truncate">
                    {user.displayName || user.email}
                  </div>
                  <DropdownMenuItem onSelect={() => setShowChangePassword(true)}>
                    <KeyRound className="w-4 h-4 mr-2" /> Ubah Kata Sandi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.assign('/')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard Publik
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
                <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                  <DialogContent className="sm:max-w-md">
                    <ChangePasswordDialog onClose={() => setShowChangePassword(false)} />
                  </DialogContent>
                </Dialog>
              </DropdownMenu>
            )}

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
      
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto w-full max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}