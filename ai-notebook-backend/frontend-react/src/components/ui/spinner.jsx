import React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-primary-600",
        secondary: "text-gray-400",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const Spinner = React.forwardRef(({ className, size, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    />
  )
})

Spinner.displayName = "Spinner"

const LoadingSpinner = ({ size = "default", variant = "default", text, className }) => {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Spinner size={size} variant={variant} />
      {text && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {text}
        </span>
      )}
    </div>
  )
}

const PageSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

export { Spinner, LoadingSpinner, PageSpinner, spinnerVariants }