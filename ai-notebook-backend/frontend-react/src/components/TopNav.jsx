import React from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import DensityToggle from './DensityToggle.jsx'

export default function TopNav({ onSearch, nbId, nbTitle, models=[], modelDefault='', model='', onChangeModel }){
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between min-h-16 px-4 py-3 bg-slate-950/60 border-b border-white/20 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-xl border border-white/20 bg-[linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.03))]" aria-hidden="true" />
        <strong className="mr-1">StudyLM</strong>
        <a href="/#/dashboard" className="text-slate-400 px-2 py-1 rounded-lg hover:bg-white/5 hover:text-white">Dashboard</a>
        <a href="/#/chat" className="text-slate-400 px-2 py-1 rounded-lg hover:bg-white/5 hover:text-white">Workspace</a>
        <a href="/docs" target="_blank" rel="noreferrer" className="text-slate-400 px-2 py-1 rounded-lg hover:bg-white/5 hover:text-white">Docs</a>
      </div>
      <div className="flex items-center gap-2">
        {nbId && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.8rem] border border-white/20 bg-white/10" title={nbId}>
            Notebook: <strong style={{marginLeft:4}}>{nbTitle || nbId.slice(0,8)+'…'}</strong>
          </span>
        )}
  {/* Global model selector moved next to Upload for prominence */}
        <button className="bg-transparent border border-white/20 text-white hover:bg-white/5 rounded-lg px-3.5 py-2" onClick={onSearch} title="Search (Ctrl+K)">Search</button>
  <ThemeToggle />
  <DensityToggle />
        <a className="relative bg-gradient-to-br from-sky-400 to-sky-500 text-black rounded-lg px-3.5 py-2 hover:brightness-105 active:translate-y-px" href="#" onClick={(e)=> e.preventDefault()} title="Upgrade plan">Upgrade</a>
        <div className="w-7 h-7 rounded-full border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.04))]" aria-label="Account" title="Account" />
      </div>
    </div>
  )
}
