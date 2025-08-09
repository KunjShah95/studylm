import React from 'react'
import { cn } from '../../lib/utils'

const Textarea = React.forwardRef(({ 
  className, 
  label,
  error,
  helperText,
  rows = 4,
  ...props 
}, ref) => {
  const textareaId = React.useId()
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId}
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400 dark:focus:border-primary-400 resize-none",
          error && "border-error-500 focus:border-error-500 focus:ring-error-500/20",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = "Textarea"

export default Textarea