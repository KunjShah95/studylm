import React from 'react'

const Button = React.forwardRef(function Button({ variant='default', className='', ...props }, ref){
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50 disabled:pointer-events-none h-9 px-4 py-2'
  const variants = {
    default: 'bg-sky-400 text-black hover:bg-sky-300',
    outline: 'border border-border bg-transparent hover:bg-white/5',
    ghost: 'bg-transparent hover:bg-white/5',
    destructive: 'bg-red-600 text-white hover:bg-red-500'
  }
  return <button ref={ref} className={[base, variants[variant]||variants.default, className].join(' ')} {...props} />
})

export default Button
