"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const ProminentTabs = TabsPrimitive.Root

const ProminentTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex h-12 items-stretch p-1 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700",
      // Mobile: allow horizontal scrolling, Desktop: flex-nowrap
      "sm:flex-nowrap",
      className
    )}
    {...props}
  />
))
ProminentTabsList.displayName = TabsPrimitive.List.displayName

const ProminentTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "box-border flex flex-1 items-center justify-center min-w-[140px] whitespace-nowrap rounded-lg px-6 py-3.5 text-base font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border-2 data-[state=active]:border-current data-[state=active]:ring-2 data-[state=active]:ring-current/30 data-[state=active]:ring-offset-2 data-[state=active]:ring-offset-background hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] touch-manipulation",
      // Mobile: ensure touch targets are adequate
      className
    )}
    {...props}
  />
))
ProminentTabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const ProminentTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
ProminentTabsContent.displayName = TabsPrimitive.Content.displayName

export { ProminentTabs, ProminentTabsList, ProminentTabsTrigger, ProminentTabsContent }
