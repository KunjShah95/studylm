import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200",
        secondary: "border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        destructive: "border-transparent bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200",
        success: "border-transparent bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200",
        warning: "border-transparent bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200",
        outline: "text-foreground border-gray-300 dark:border-gray-600",
        gradient: "border-transparent bg-gradient-to-r from-primary-500 to-primary-600 text-white",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({ className, variant, size, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }