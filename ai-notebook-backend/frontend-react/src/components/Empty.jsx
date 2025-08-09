import React from 'react'

export default function Empty({ title, subtitle, action }){
  return (
    <div className="text-center p-8 border border-dashed border-white/30 rounded-xl bg-white/5">
      <div className="w-10 h-10 leading-10 mx-auto mb-2 rounded-md bg-white/10 border border-white/20" aria-hidden="true">✦</div>
      <h3 className="mb-1.5 text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-slate-400 text-[0.9rem]">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
