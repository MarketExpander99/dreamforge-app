import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base input styling - consistent across all forms
          "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition-all duration-200",
          // File input specific styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Placeholder styling
          "placeholder:text-gray-500 placeholder:font-normal",
          // Focus states - consistent focus ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          // Dark mode variants
          "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500 dark:disabled:bg-gray-700",
          // Error state (when parent has error class)
          "invalid:border-red-500 invalid:ring-red-500 invalid:focus-visible:ring-red-500 invalid:focus-visible:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }