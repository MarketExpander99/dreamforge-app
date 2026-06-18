'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, User, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const menuItems = [
    {
      label: 'Discover',
      href: '/discover',
      icon: Search,
      isActive: pathname === '/discover',
    },
    {
      label: 'Learning',
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

        <div className="mt-auto pt-5 border-t border-zinc-800">
          <p className="text-[10px] text-zinc-500 text-center">Powered by Grok</p>
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
        </div>
      </div>
    </>
  );
};

// Export both ways for maximum compatibility
export default NavigationComponent;
export const Navigation = NavigationComponent;