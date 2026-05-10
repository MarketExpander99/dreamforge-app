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
      "inline-flex h-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 shadow-lg border border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide",
      // Mobile: allow horizontal scrolling, Desktop: wrap if needed
      "sm:flex-wrap sm:justify-start",
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
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 sm:px-6 py-3 text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-brand-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-md min-h-[44px] min-w-[44px] flex-shrink-0",
      // Mobile: ensure touch targets are adequate
      "touch-manipulation active:scale-95",
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
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-slate-400 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
ProminentTabsContent.displayName = TabsPrimitive.Content.displayName

export { ProminentTabs, ProminentTabsList, ProminentTabsTrigger, ProminentTabsContent }
