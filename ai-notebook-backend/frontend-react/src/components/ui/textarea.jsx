import React from 'react'

const Textarea = React.forwardRef(function Textarea({ className = '', rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={[
        'w-full rounded-md border border-border bg-white/5 px-3 py-2 text-sm text-foreground',
        'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
        'min-h-[90px] resize-vertical',
        className,
      ].join(' ')}
      {...props}
    />
  )
})

export default Textarea
