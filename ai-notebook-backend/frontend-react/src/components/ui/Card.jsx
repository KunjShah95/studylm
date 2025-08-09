import React from 'react'

const Card = React.forwardRef(function Card({ 
  className = '', 
  children, 
  hover = true, 
  ...props 
}, ref) {
  const baseClasses = 'glass rounded-2xl p-6 shadow-glass transition-all duration-300'
  const hoverClasses = hover ? 'hover:transform hover:-translate-y-1 hover:shadow-2xl' : ''
  
  return (
    <div 
      ref={ref} 
      className={`${baseClasses} ${hoverClasses} ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
})

const CardHeader = React.forwardRef(function CardHeader({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <div 
      ref={ref} 
      className={`flex flex-col space-y-1.5 p-6 ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
})

const CardTitle = React.forwardRef(function CardTitle({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <h3 
      ref={ref} 
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`} 
      {...props}
    >
      {children}
    </h3>
  )
})

const CardDescription = React.forwardRef(function CardDescription({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <p 
      ref={ref} 
      className={`text-sm text-slate-400 ${className}`} 
      {...props}
    >
      {children}
    </p>
  )
})

const CardContent = React.forwardRef(function CardContent({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <div 
      ref={ref} 
      className={`p-6 pt-0 ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
})

const CardFooter = React.forwardRef(function CardFooter({ 
  className = '', 
  children, 
  ...props 
}, ref) {
  return (
    <div 
      ref={ref} 
      className={`flex items-center p-6 pt-0 ${className}`} 
      {...props}
    >
      {children}
    </div>
  )
})

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card