import React, { useEffect, useState } from 'react'
import Button from './ui/button.jsx'
import Textarea from './ui/textarea.jsx'

export function Notes({ BASE, fileId }){
  const [notes, setNotes] = useState([])
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function fetchJSON(url, opts){
    const res = await fetch(url, opts)
    if(!res.ok) throw new Error(await res.text())
    return res.json()
  }

  useEffect(()=>{
    (async()=>{
  if(!fileId){ setNotes([]); return }
  setLoading(true)
      try{
        const res = await fetchJSON(`${BASE}/notes/${fileId}`)
        setNotes(res.notes||[])
  }catch(e){ setMsg(String(e.message||e)) }
  finally { setLoading(false) }
    })()
  }, [fileId])

  async function save(){
    if(!fileId || !note.trim()) return
    try{
      const res = await fetchJSON(`${BASE}/save_note`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ file_id:fileId, note:note.trim() })
      })
      setMsg(res.message||'Saved')
      setNote('')
      const updated = await fetchJSON(`${BASE}/notes/${fileId}`)
      setNotes(updated.notes||[])
    }catch(e){ setMsg(String(e.message||e)) }
  }

  return (
    <div>
  <h2 className="mt-1 mb-2 text-lg font-semibold">Notes</h2>
  <div className="flex flex-col gap-1.5 mb-2">
        {loading ? (
          <>
    <div className="h-9 rounded bg-white/10 border border-white/20 animate-pulse"></div>
    <div className="h-9 rounded bg-white/10 border border-white/20 animate-pulse"></div>
          </>
        ) : (
          notes.length>0 ? (
    notes.map((n,i)=>(<div className="bg-white/10 border border-white/20 rounded px-3 py-2" key={i}>{n}</div>))
          ) : (
    <div className="text-slate-400 text-[0.9rem]">No notes yet.</div>
          )
        )}
      </div>
      <Textarea rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Your note..." />
  <div className="flex items-center gap-2 my-2">
        <Button onClick={save}>Save note</Button>
    <span className="text-slate-400 text-[0.9rem]">{msg}</span>
      </div>
    </div>
  )
}
