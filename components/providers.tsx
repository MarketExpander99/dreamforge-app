'use client'

import React from 'react'
import { AuthProvider } from '@/lib/user-context'
import { SidebarProvider } from '@/components/navigation'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </AuthProvider>
  )
}