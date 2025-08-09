import React from 'react'
import Button from './ui/button.jsx'

export default function Modal({ open, title, children, onClose, actions }){
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title||'Dialog'}>
      <div className="w-[min(560px,92%)] bg-slate-900/90 border border-white/10 rounded-xl overflow-hidden">
        {title && <div className="px-4 py-3 border-b border-white/10"><h3 className="text-lg font-semibold">{title}</h3></div>}
        <div className="p-4">{children}</div>
        <div className="px-4 py-3 border-t border-white/10 flex gap-2 justify-end">
          {actions}
          <Button variant="outline" onClick={onClose} aria-label="Close dialog">Close</Button>
        </div>
      </div>
    </div>
  )
}
