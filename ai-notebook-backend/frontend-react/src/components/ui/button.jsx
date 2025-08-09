import React from 'react'
import LoadingSpinner from './LoadingSpinner.jsx'

const Button = React.forwardRef(function Button({ 
  variant = 'default', 
  size = 'default',
  className = '', 
  children,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props 
}, ref) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50 disabled:pointer-events-none active:scale-95'
  
  const variants = {
    default: 'bg-sky-400 text-black hover:bg-sky-300 shadow-lg hover:shadow-xl',
    secondary: 'glass hover:bg-white/10 text-white',
    outline: 'border border-white/20 bg-transparent hover:bg-white/5 text-white',
    ghost: 'bg-transparent hover:bg-white/5 text-white',
    destructive: 'bg-red-600 text-white hover:bg-red-500 shadow-lg hover:shadow-xl',
    success: 'bg-green-600 text-white hover:bg-green-500 shadow-lg hover:shadow-xl',
    warning: 'bg-yellow-600 text-black hover:bg-yellow-500 shadow-lg hover:shadow-xl'
  }
  
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    default: 'h-9 px-4 py-2 text-sm',
    lg: 'h-11 px-6 text-base',
    xl: 'h-12 px-8 text-lg'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <button 
      ref={ref} 
      className={`${baseClasses} ${variants[variant] || variants.default} ${sizes[size]} ${className}`} 
      disabled={isDisabled}
      {...props}
    >
      {leftIcon && !loading && (
        <span className="mr-2">{leftIcon}</span>
      )}
      
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      
      {children}
      
      {rightIcon && !loading && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  )
})

export default Button
