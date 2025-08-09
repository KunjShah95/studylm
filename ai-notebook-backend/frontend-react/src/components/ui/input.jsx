import React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef(({ 
  className, 
  type = "text",
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const inputId = React.useId()
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400 dark:focus:border-primary-400",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-error-500 focus:border-error-500 focus:ring-error-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
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

Input.displayName = "Input"

export default Input