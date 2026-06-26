'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, User, BookOpen, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/user-context';

// Full context for maximum compatibility with existing code in the repo
type SidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggle = () => {}; // no-op (keeps existing code happy)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

const NavigationComponent = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, authLoading: loading, signOut } = useAuth();

  const menuItems = [
    {
      label: 'Discover',
      href: '/discover',
      icon: Search,
      isActive: pathname === '/discover',
    },
    {
      label: 'Learn',
      href: '/learning',
      icon: BookOpen,
      isActive: pathname === '/learning' || pathname?.startsWith('/learning/'),
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      isActive: pathname === '/profile',
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 h-screen fixed left-0 top-0 p-6">
        <div className="mb-8 px-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Skill Gain
          </h1>
          <p className="text-[10px] text-zinc-500 mt-0.5">Discover the lattice</p>
        </div>

        <nav className="flex-1 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2.5 text-[15px] h-11',
                    item.isActive && 'bg-[#0078D4] hover:bg-[#006CB8]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Login / Logout Section */}
        <div className="mt-auto pt-4 border-t border-zinc-800">
          {!loading && (
            user ? (
              <div className="px-1 space-y-2">
                {/* User info */}
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-zinc-800/50">
                  <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-200 flex-shrink-0">
                    {displayName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-zinc-200 truncate">
                      {displayName}
                    </div>
                    {displayEmail && (
                      <div className="text-[10px] text-zinc-500 truncate">
                        {displayEmail}
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-sm h-9 text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="px-1 space-y-1">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sm h-9"
                  >
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm h-9 text-zinc-400 hover:text-zinc-200"
                  >
                    Sign up
                  </Button>
                </Link>
              </div>
            )
          )}

          <p className="text-[10px] text-zinc-500 text-center pt-4">
            Powered by Grok
          </p>
        </div>
      </div>

      {/* Mobile Bottom Navigation — calm Win10 style */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <div className="flex items-center justify-around py-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full flex flex-col items-center gap-0.5 py-2 text-[10px]',
                    item.isActive && 'text-[#0078D4]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}

          {/* Mobile Auth Action */}
          {!loading && (
            user ? (
              <button
                onClick={handleLogout}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] text-zinc-400 active:text-red-400"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            ) : (
              <Link href="/auth/login" className="flex-1">
                <Button
                  variant="ghost"
                  className="w-full flex flex-col items-center gap-0.5 py-2 text-[10px]"
                >
                  <LogIn className="h-5 w-5" />
                  Log in
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </>
  );
};

// Export both ways for maximum compatibility
export default NavigationComponent;
export const Navigation = NavigationComponent;
