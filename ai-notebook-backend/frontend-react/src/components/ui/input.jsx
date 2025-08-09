import React from 'react'

const Input = React.forwardRef(function Input({ 
  className = '', 
  type = 'text',
  error,
  label,
  description,
  leftIcon,
  rightIcon,
  ...props 
}, ref) {
  const baseClasses = 'flex h-10 w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm backdrop-blur-sm'
  const focusClasses = 'focus:bg-white/10 focus:border-sky-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'
  const errorClasses = error ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''
  const disabledClasses = 'disabled:cursor-not-allowed disabled:opacity-50'
  const placeholderClasses = 'placeholder:text-slate-400'
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        
        <input 
          ref={ref} 
          type={type}
          className={`${baseClasses} ${focusClasses} ${errorClasses} ${disabledClasses} ${placeholderClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props} 
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      
      {description && !error && (
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      )}
    </div>
  )
})

export default Input
