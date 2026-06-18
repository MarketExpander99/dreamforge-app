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
      // Calm Win10 style prominent tabs — 8px grid foundation
      "flex h-11 items-stretch p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
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
      // Fib-friendly padding + no aggressive scale. Clean active state.
      "box-border flex flex-1 items-center justify-center min-w-[140px] whitespace-nowrap rounded-md px-5 py-2 text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#0078D4] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#006CB8] hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-[0.985] touch-manipulation",
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
      "mt-5 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
ProminentTabsContent.displayName = TabsPrimitive.Content.displayName

export { ProminentTabs, ProminentTabsList, ProminentTabsTrigger, ProminentTabsContent }
