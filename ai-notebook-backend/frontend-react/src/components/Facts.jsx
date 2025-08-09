import React, { useEffect, useState } from 'react'
import Button from './ui/button.jsx'
import Input from './ui/input.jsx'

export function Facts({ BASE, nbId }){
  const [facts, setFacts] = useState([])
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')

  async function fetchJSON(url, opts){
    const res = await fetch(url, opts)
    if(!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function refresh(){
    if(!nbId){ setFacts([]); return }
    try{
      const res = await fetchJSON(`${BASE}/notebooks/${nbId}`)
      setFacts(res.facts || [])
    }catch(e){ setMsg(String(e.message||e)) }
  }

  async function add(){
    if(!nbId || !text.trim()) return
    try{
      await fetchJSON(`${BASE}/notebooks/${nbId}/facts`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: text.trim() }) })
      setText('')
      await refresh()
    }catch(e){ setMsg(String(e.message||e)) }
  }

  async function remove(id){
    if(!nbId) return
    try{
      await fetchJSON(`${BASE}/notebooks/${nbId}/facts/${id}`, { method:'DELETE' })
      await refresh()
    }catch(e){ setMsg(String(e.message||e)) }
  }

  useEffect(()=>{ refresh() }, [nbId])

  return (
    <div>
  <h2 className="mt-1 mb-2 text-lg font-semibold">Facts</h2>
  <div className="flex flex-col gap-1.5 mb-2">
        {facts.length ? (
          facts.map(f => (
    <div className="bg-white/10 border border-white/20 rounded px-3 py-2 flex items-start justify-between gap-2" key={f.id}>
              <div className="pr-2">{f.text}</div>
              <Button variant="outline" onClick={()=>remove(f.id)}>Remove</Button>
            </div>
          ))
        ) : (
      <div className="text-slate-400 text-[0.9rem]">No facts yet.</div>
        )}
      </div>
  <div className="flex items-center gap-2 my-2">
        <Input value={text} onChange={e=>setText(e.target.value)} placeholder="Add a guiding fact for this notebook…" />
        <Button onClick={add}>Add</Button>
      </div>
  {msg && <div className="text-slate-400 text-[0.9rem]">{msg}</div>}
    </div>
  )
}
