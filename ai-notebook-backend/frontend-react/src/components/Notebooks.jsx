import React, { useEffect, useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import Empty from './Empty.jsx'
import { useToast } from './ToastProvider.jsx'
import Button from './ui/button.jsx'
import Input from './ui/input.jsx'

export function Notebooks({ BASE, nbId, onSelect }){
  const toast = useToast()
  const [list, setList] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')
  const [renameId, setRenameId] = useState('')
  const [renameTitle, setRenameTitle] = useState('')

  async function fetchJSON(url, opts){
    const res = await fetch(url, opts)
    if(!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function refresh(){
    setLoading(true)
    try{
      const res = await fetchJSON(`${BASE}/notebooks`)
      setList(res.notebooks || [])
    }catch(e){ setMsg(String(e.message||e)) }
    finally{ setLoading(false) }
  }

  async function create(){
    if(!title.trim()) return
    try{
      const res = await fetchJSON(`${BASE}/notebooks`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title:title.trim() }) })
      setTitle('')
      await refresh()
      onSelect && onSelect(res.id)
      toast.push('Notebook created', 'success')
    }catch(e){ setMsg(String(e.message||e)) }
  }

  useEffect(()=>{ refresh() }, [])

  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase()
    if(!t) return list
    return list.filter(nb => (nb.title||'').toLowerCase().includes(t) || (nb.id||'').toLowerCase().includes(t))
  }, [q, list])

  async function doRename(){
    if(!renameId || !renameTitle.trim()) return
    try{ await fetchJSON(`${BASE}/notebooks/${renameId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: renameTitle.trim() }) }); toast.push('Renamed', 'success'); setRenameId(''); setRenameTitle(''); await refresh() }catch(e){ setMsg(String(e.message||e)) }
  }

  async function doDelete(id){
    const ok = window.confirm('Delete this notebook? This cannot be undone.')
    if(!ok) return
    try{ await fetchJSON(`${BASE}/notebooks/${id}`, { method:'DELETE' }); toast.push('Deleted', 'success'); if(nbId===id){ onSelect && onSelect('') } await refresh() }catch(e){ setMsg(String(e.message||e)) }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2>Notebooks</h2>
        <div className="inline-flex items-center gap-2">
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="max-w-[160px]" />
          <Button variant="outline" onClick={refresh} disabled={loading}>Refresh</Button>
        </div>
      </div>
  <div className="flex items-center gap-2 my-2">
        <label>New</label>
        <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Notebook title" onKeyDown={e=>{ if(e.key==='Enter') create() }} />
        <Button onClick={create}>Create</Button>
      </div>

      {filtered.length===0 ? (
        <Empty title="No notebooks yet" subtitle="Create your first notebook to organize sources and settings." action={
          <Button onClick={create} disabled={!title.trim()}>Create “{title||'My Notebook'}”</Button>
        } />
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map(nb => (
            <div key={nb.id} className="bg-white/10 border border-white/20 rounded px-3 py-2 grid grid-cols-[1fr_auto] gap-2 items-center">
              <div>
                <div className="flex gap-2 items-center">
                  <strong>{nb.title}</strong>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.8rem] border border-white/20">{nb.sources_count} sources</span>
                  {nbId===nb.id && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.8rem] border border-white/20">Selected</span>}
                </div>
                <div className="text-slate-400 text-[0.9rem] font-mono" title={nb.id}>ID: {nb.id.slice(0,8)}…</div>
              </div>
              <div className="inline-flex gap-2">
                <Button onClick={()=> onSelect && onSelect(nb.id)} disabled={nbId===nb.id}>Use</Button>
                <Button variant="outline" onClick={()=>{ setRenameId(nb.id); setRenameTitle(nb.title||'') }}>Rename</Button>
                <Button variant="destructive" onClick={()=> doDelete(nb.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 my-2">
        <label>Actions</label>
        <Button variant="outline" disabled={!nbId} onClick={async()=>{
          if(!nbId) return
          const ok = window.confirm('Clear chat history for this notebook?')
          if(!ok) return
          try{ await fetchJSON(`${BASE}/notebooks/${nbId}/history`, { method:'DELETE' }); toast.push('History cleared', 'success') }catch(e){ setMsg(String(e.message||e)) }
        }}>Clear history</Button>
      </div>
      {msg && <div className="text-slate-400 text-[0.9rem]">{msg}</div>}

      <Modal open={!!renameId} title="Rename notebook" onClose={()=>{ setRenameId(''); setRenameTitle('') }} actions={
        <>
          <Button onClick={doRename} disabled={!renameTitle.trim()}>Save</Button>
          <Button variant="outline" onClick={()=>{ setRenameId(''); setRenameTitle('') }}>Cancel</Button>
        </>
      }>
        <Input value={renameTitle} onChange={e=>setRenameTitle(e.target.value)} placeholder="Notebook title" />
      </Modal>
    </div>
  )
}
