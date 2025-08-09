import React from 'react'
import { motion } from 'framer-motion'

const items = [
  { key:'dashboard', label:'Dashboard', icon:'🏠' },
  { key:'chat', label:'Chat', icon:'💬' },
  { key:'notebooks', label:'Notebooks', icon:'📒' },
  { key:'notes', label:'Notes', icon:'📝' },
  { key:'facts', label:'Facts', icon:'⭐' },
  { key:'settings', label:'Settings', icon:'⚙️' },
]

export default function Sidebar({ current, onChange }){
  return (
  <aside className="sticky top-3 self-start bg-slate-900/80 border border-white/10 rounded-2xl p-3 h-[calc(100vh-2rem)] w-full" aria-label="Primary">
      <div className="flex items-center gap-2.5 pb-2 mb-2 border-b border-white/10">
        <div className="w-7 h-7 rounded-xl border border-white/20 bg-[linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.03))]" aria-hidden="true" />
        <span className="font-semibold">StudyLM</span>
      </div>
      <nav className="flex flex-col gap-1 p-1">
        {items.map(it => (
          <button
            key={it.key}
            className={`relative text-left bg-transparent text-white px-3 py-2 rounded-xl cursor-pointer flex items-center gap-2 hover:bg-white/10 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${current===it.key?'bg-sky-400/15 border-sky-400/40':'border-transparent'}`}
            aria-current={current===it.key ? 'page' : undefined}
            onClick={()=>onChange(it.key)}
          >
            <span aria-hidden="true">{it.icon}</span>
            <span>{it.label}</span>
            {current===it.key && <motion.span layoutId="nav-underline" className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sky-400" />}
          </button>
        ))}
      </nav>
    </aside>
  )
}
