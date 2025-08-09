import React from 'react'

const Input = React.forwardRef(function Input({ className='', ...props }, ref){
  return (
    <input ref={ref} className={[
      'flex h-9 w-full rounded-md border border-border bg-white/5 px-3 py-1 text-sm text-foreground',
      'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
      className
    ].join(' ')} {...props} />
  )
})

export default Input
