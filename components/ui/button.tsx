import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985]",
  {
    variants: {
      variant: {
        // Primary — Windows 10 blue (#0078D4 inspired), calm & trustworthy
        default: "bg-[#0078D4] text-white hover:bg-[#006CB8] shadow-sm active:bg-[#005A9E]",
        primary: "bg-[#0078D4] text-white hover:bg-[#006CB8] shadow-sm active:bg-[#005A9E]",

        // Success
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",

        // Secondary calm
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 shadow-sm",

        // Outline — crisp Win10 feel
        outline: "border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100 shadow-sm",

        // Ghost — minimal
        ghost: "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",

        // Danger
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",

        // Link
        link: "text-[#0078D4] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        // 8px grid + touch friendly. Default uses Fibonacci-friendly 40px height
        default: "h-10 px-5 py-2 min-h-[40px]",
        sm: "h-9 rounded-md px-3.5 text-sm min-h-[36px]",
        lg: "h-11 rounded-md px-6 text-base min-h-[44px]",
        xl: "h-12 rounded-md px-8 text-base min-h-[48px]",
        icon: "h-10 w-10 min-h-[40px] min-w-[40px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }