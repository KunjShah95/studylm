import React from 'react'

const Badge = React.forwardRef(function Badge({ 
  variant = 'default', 
  size = 'default',
  className = '', 
  children,
  ...props 
}, ref) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400'
  
  const variants = {
    default: 'glass text-white hover:bg-white/20',
    secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
    destructive: 'bg-red-600 text-white hover:bg-red-500',
    outline: 'border border-white/20 text-white hover:bg-white/5',
    success: 'bg-green-600 text-white hover:bg-green-500',
    warning: 'bg-yellow-600 text-black hover:bg-yellow-500',
    info: 'bg-blue-600 text-white hover:bg-blue-500'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2.5 py-0.5 text-xs', 
    lg: 'px-3 py-1 text-sm'
  }
  
  return (
    <span 
      ref={ref} 
      className={`${baseClasses} ${variants[variant] || variants.default} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </span>
  )
})

export default Badge