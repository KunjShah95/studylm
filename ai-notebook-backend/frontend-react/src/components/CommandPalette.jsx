import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function CommandPalette({ open, onClose, onRun }){
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const listRef = useRef(null)
  const [idx, setIdx] = useState(0)
  const cmds = useMemo(()=>[
    { id:'new-notebook', label:'New Notebook' },
    { id:'attach-source', label:'Attach current file to notebook' },
    { id:'clear-chat', label:'Clear notebook chat' },
    { id:'upload', label:'Upload PDF' },
  ], [])
  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase()
    return !t ? cmds : cmds.filter(c => c.label.toLowerCase().includes(t))
  }, [q, cmds])

  useEffect(()=>{ if(open){ setQ(''); setIdx(0); setTimeout(()=> ref.current?.focus(), 50) } }, [open])
  if(!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
      <div className="w-[min(640px,96%)] m-[8vh_auto] bg-slate-900/90 border border-white/10 rounded-xl p-2" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={ref}
          value={q}
          onChange={e=>{ setQ(e.target.value); setIdx(0) }}
          onKeyDown={e=>{
            if(e.key==='ArrowDown'){ e.preventDefault(); setIdx(i=> Math.min(i+1, filtered.length-1)) }
            else if(e.key==='ArrowUp'){ e.preventDefault(); setIdx(i=> Math.max(i-1, 0)) }
            else if(e.key==='Enter'){ const c = filtered[idx]; if(c){ onRun?.(c.id); onClose?.() } }
            else if(e.key==='Escape'){ onClose?.() }
          }}
          placeholder="Type a command…"
          role="combobox"
          aria-expanded="true"
          aria-controls="cmd-list"
          aria-activedescendant={filtered[idx]?.id || ''}
          className="w-full mb-2 rounded-md border border-white/20 bg-white/5 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
        <div id="cmd-list" className="flex flex-col max-h-[50vh] overflow-auto" role="listbox" ref={listRef}>
          {filtered.map((c, i) => (
            <button
              key={c.id}
              id={c.id}
              role="option"
              aria-selected={i===idx}
              className={(i===idx? 'bg-white/5 ' : '')+ 'text-left px-2 py-2 rounded-md border-0 bg-transparent text-white hover:bg-white/5'}
              onMouseEnter={()=> setIdx(i)}
              onClick={()=>{ onRun?.(c.id); onClose?.() }}
            >{c.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
