import React from 'react'

const LoadingSpinner = React.forwardRef(function LoadingSpinner({ 
  size = 'default',
  className = '',
  color = 'primary',
  ...props 
}, ref) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }
  
  const colorClasses = {
    primary: 'text-sky-400',
    white: 'text-white',
    gray: 'text-gray-400',
    muted: 'text-slate-400'
  }
  
  return (
    <div 
      ref={ref}
      className={`inline-flex items-center justify-center ${className}`}
      {...props}
    >
      <div 
        className={`animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${colorClasses[color]}`}
        style={{ borderTopColor: 'transparent' }}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
})

const LoadingSpinnerWithText = React.forwardRef(function LoadingSpinnerWithText({
  text = 'Loading...',
  size = 'default',
  className = '',
  ...props
}, ref) {
  return (
    <div 
      ref={ref}
      className={`flex items-center justify-center gap-3 ${className}`}
      {...props}
    >
      <LoadingSpinner size={size} />
      <span className="text-sm text-slate-400">{text}</span>
    </div>
  )
})

const LoadingDots = React.forwardRef(function LoadingDots({
  className = '',
  color = 'primary',
  ...props
}, ref) {
  const colorClasses = {
    primary: 'bg-sky-400',
    white: 'bg-white',
    gray: 'bg-gray-400',
    muted: 'bg-slate-400'
  }
  
  return (
    <div 
      ref={ref}
      className={`flex items-center justify-center gap-1 ${className}`}
      {...props}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${colorClasses[color]} animate-pulse`}
          style={{ 
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
})

const LoadingBar = React.forwardRef(function LoadingBar({
  progress = 0,
  className = '',
  color = 'primary',
  ...props
}, ref) {
  const colorClasses = {
    primary: 'bg-sky-400',
    white: 'bg-white',
    gray: 'bg-gray-400',
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    destructive: 'bg-red-400'
  }
  
  return (
    <div 
      ref={ref}
      className={`w-full bg-gray-700 rounded-full h-2 overflow-hidden ${className}`}
      {...props}
    >
      <div 
        className={`h-full transition-all duration-300 ease-out ${colorClasses[color]}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
})

LoadingSpinner.WithText = LoadingSpinnerWithText
LoadingSpinner.Dots = LoadingDots
LoadingSpinner.Bar = LoadingBar

export default LoadingSpinner