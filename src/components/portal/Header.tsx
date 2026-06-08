'use client';

import { useState } from 'react';
import { getRedirectPath } from '@/lib/auth';
import {
  LogOut,
  LogIn,
  User,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { useClock } from '@/hooks/use-clock';
import { canAccessAdmin } from '@/lib/permissions';

function AuthSection({ onNavigate }: { onNavigate?: () => void }) {
  const { user, setUser, setCurrentView } = useAppStore();
  const isAdmin = canAccessAdmin(user?.role);

  function getDashboardUrl(): string {
    return getRedirectPath(user?.role ?? 'publik');
  }

  if (!user) {
    return (
      <Button
        onClick={() => {
          window.location.assign('/login');
          onNavigate?.();
        }}
        size="sm"
        className="bg-yellow-500 hover:bg-yellow-400 text-[#0d3b66] font-semibold border-0"
      >
        <LogIn className="w-4 h-4 mr-1.5" />
        Login
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 backdrop-blur">
        {isAdmin ? (
          <Shield className="w-4 h-4 text-yellow-400" />
        ) : (
          <User className="w-4 h-4 text-blue-200" />
        )}
        <span className="text-sm font-medium text-white max-w-[130px] truncate">
          {user.displayName}
        </span>
      </div>
      {isAdmin && (
        <Button
          onClick={() => {
            window.location.assign(getDashboardUrl());
            onNavigate?.();
          }}
          size="sm"
          className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
        >
          <Shield className="w-4 h-4 mr-1.5" />
          Dashboard
        </Button>
      )}
      <Button
        onClick={() => {
          setUser(null);
          setCurrentView('portal');
          window.history.replaceState(null, '', '/');
          onNavigate?.();
        }}
        size="sm"
        variant="ghost"
        className="text-blue-200 hover:text-white hover:bg-white/10"
      >
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { user, setUser, setCurrentView } = useAppStore();
  const isAdmin = canAccessAdmin(user?.role);

  function getDashboardUrlMobile(): string {
    return getRedirectPath(user?.role ?? 'publik');
  }

  return (
    <div
      className="md:hidden border-t border-white/10 shadow-2xl bg-gradient-to-b from-[#0d3b66] to-[#082545]"
    >
      <div className="px-4 py-3 space-y-1">
          {!user ? (
            <Button
              onClick={() => {
                window.location.assign('/login');
                onClose();
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#0d3b66] font-semibold border-0 mt-1"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-md">
                {isAdmin ? (
                  <Shield className="w-4 h-4 text-yellow-400" />
                ) : (
                  <User className="w-4 h-4 text-blue-200" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-blue-200 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
                {isAdmin && (
                  <Button
                    onClick={() => {
                      window.location.assign(getDashboardUrlMobile());
                      onClose();
                    }}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent mt-1"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
              <Button
                onClick={() => {
                  setUser(null);
                  setCurrentView('portal');
                  window.history.replaceState(null, '', '/');
                }}
                variant="outline"
                className="w-full border-red-400/30 text-red-300 hover:bg-red-500/10 bg-transparent mt-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </>
          )}
       </div>
    </div>
  );
}

export default function Header() {
  const { currentTime, currentDate } = useClock();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="sticky top-0 z-50 bg-gradient-to-b from-[#1a5276] to-[#0d3b66]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 sm:py-4 gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logokab.png"
              alt="Logo Kabupaten Cirebon"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-lg"
            />
            <div className="hidden sm:block min-w-0">
              <h1 className="text-base lg:text-lg font-bold text-white uppercase tracking-wider leading-tight">
                Dinas Pendidikan
              </h1>
              <p className="text-xs lg:text-sm text-blue-100 leading-tight mt-0.5">
                Portal Tim Kerja Kecamatan Lemahabang
              </p>
              <p className="text-xs text-blue-200/80 leading-tight">
                Dinas Pendidikan Kabupaten Cirebon
              </p>
            </div>
          </div>
          <div className="sm:hidden flex-1 min-w-0 text-center">
            <h1 className="text-sm font-bold text-white uppercase tracking-wide leading-tight">
              Dinas Pendidikan
            </h1>
            <p className="text-[10px] text-blue-200 leading-tight">
              Kec. Lemahabang
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-medium text-blue-100 leading-tight">
                {currentDate}
              </span>
              <span className="text-sm font-mono font-semibold text-white leading-tight mt-0.5">
                {currentTime}
              </span>
            </div>
            <div className="lg:hidden flex flex-col items-end">
              <span className="text-[10px] text-blue-200 leading-tight">
                {currentDate}
              </span>
              <span className="text-xs font-mono font-medium text-white leading-tight">
                {currentTime}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 ml-2">
              <AuthSection />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <MobileMenu onClose={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}
