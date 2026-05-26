'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search, User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const toggle = () => {};

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};

const NavigationComponent = () => {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Discover', href: '/discover', icon: Search, isActive: pathname === '/discover' },
    { label: 'Learning Path', href: '/learning', icon: GraduationCap, isActive: pathname === '/learning' },
    { label: 'Profile', href: '/profile', icon: User, isActive: pathname === '/profile' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 h-screen fixed left-0 top-0 p-6 z-50">
        <div className="mb-12">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Skill Gain
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Discover the lattice</p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3 text-base h-12',
                    item.isActive && 'bg-purple-600 hover:bg-purple-600'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 text-center">Powered by Grok • E8 Lattice</p>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <div className="flex items-center justify-around py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full flex flex-col items-center gap-1 py-3 text-xs',
                    item.isActive && 'text-purple-400'
                  )}
                >
                  <Icon className="h-6 w-6" />
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

export default NavigationComponent;
export const Navigation = NavigationComponent;