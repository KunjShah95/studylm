import React, { useEffect, useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import Empty from './Empty.jsx'
import { useToast } from './ToastProvider.jsx'
import Button from './ui/button.jsx'
import Input from './ui/input.jsx'

export function Files({ BASE, files, fileId, onSelect, status, onRefresh }){
  const toast = useToast()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [label, setLabel] = useState('')
  const [q, setQ] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function renderBadge(){
  const base = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.8rem] border'
  if(status?.error) return <span className={`${base} border-red-500/50`}>Error</span>
  if(status?.ready) return <span className={`${base} border-emerald-400/50`}>Ready</span>
  if(status?.stage) return <span className={`${base} border-amber-400/50`}>{status.stage}</span>
  return <span className={`${base} border-white/20`}>Idle</span>
  }

  async function fetchJSON(url, opts){
    const res = await fetch(url, opts)
    if(!res.ok) throw new Error(await res.text())
    return res.json()
  }

  useEffect(()=>{
    (async()=>{
      if(!fileId){ setInfo(null); return }
      setLoading(true)
      try{
        const res = await fetchJSON(`${BASE}/file/${fileId}`)
        setInfo(res)
      }catch(e){ setInfo(null) }
      finally{ setLoading(false) }
    })()
  }, [fileId])

  // Keep local label input in sync when selection changes
  useEffect(()=>{
    if(!fileId){ setLabel(''); return }
  const f = (files||[]).find(x => (x.file_id||'')===fileId || (x.file||'').split('.')[0]===fileId)
    setLabel(f?.label || '')
  }, [fileId, files])

  async function handleDelete(){
    if(!fileId) return
    setDeleting(true)
    try{
      await fetchJSON(`${BASE}/file/${fileId}`, { method:'DELETE' })
      onSelect('')
      onRefresh && onRefresh()
      setInfo(null)
    }catch(e){ alert('Delete failed: '+(e.message||e)) }
    finally{ setDeleting(false) }
  }
  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase()
    if(!term) return files||[]
    return (files||[]).filter(f=>{
      const id = f.file_id || (f.file||'').split('.')[0]
      return id.toLowerCase().includes(term) || (f.file||'').toLowerCase().includes(term) || (f.label||'').toLowerCase().includes(term)
    })
  }, [files, q])

  async function saveLabel(){
    if(!fileId) return
    try{
      await fetchJSON(`${BASE}/file/${fileId}/label`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ label }) })
      onRefresh && onRefresh()
      toast.push('Label updated', 'success')
    }catch(e){ toast.push('Update label failed', 'error') }
  }

  const noFiles = (files||[]).length===0

  return (
    <>
    <div>
      <div className="flex items-center justify-between">
        <h2>Document</h2>
        <div className="inline-flex gap-2 items-center">
          {renderBadge()}
          {status?.embedding_model && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.8rem] border border-white/20">EMB: <span className="font-mono">{status.embedding_model}</span></span>}
          {status?.chat_model && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.8rem] border border-white/20">LLM: <span className="font-mono">{status.chat_model}</span></span>}
        </div>
      </div>
      <div className="flex items-center gap-2 my-2">
        <label>File</label>
        <select className="max-w-[420px] h-9 rounded-md bg-white/10 border border-white/25 text-white px-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={fileId} onChange={e=>onSelect(e.target.value)} disabled={noFiles}>
          <option value="">Select…</option>
          {filtered.map(f=>{
            const id = f.file_id || (f.file||'').split('.')[0]
            const name = f.file || `${id}`
            const label = f.label ? ` — ${f.label}` : ''
            return <option key={id} value={id}>{name}{label}</option>
          })}
        </select>
        <Input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} className="max-w-[140px]" disabled={noFiles} />
        <Button variant="outline" onClick={onRefresh}>Refresh</Button>
        <Button variant="destructive" onClick={()=>setConfirmOpen(true)} disabled={!fileId || deleting || noFiles}>Delete</Button>
      </div>

      {status?.error && <div className="text-red-500">{status.error}</div>}
      {!status?.ready && !status?.error && fileId && <div className="text-slate-400 text-[0.9rem]">Waiting for indexing…</div>}

      {noFiles ? (
        <Empty title="No documents yet" subtitle="Upload a PDF to start chatting and generating study aids." action={
          <Button onClick={()=> document.querySelector('input[type=file]')?.click()}>Upload PDF</Button>
        } />
      ) : (
      <div className="flex flex-col gap-1.5 mt-1">
        {loading ? (
          <>
            <div className="h-9 rounded bg-white/10 border border-white/20 animate-pulse"></div>
            <div className="h-9 rounded bg-white/10 border border-white/20 animate-pulse"></div>
          </>
        ) : info ? (
          <div className="bg-white/10 border border-white/20 rounded px-3 py-2 grid grid-cols-[140px_1fr] gap-1.5">
            <div className="text-slate-400 text-[0.9rem]">Size</div><div>{info.size_mb} MB</div>
            <div className="text-slate-400 text-[0.9rem]">Pages</div><div>{info.pages ?? '-'}</div>
            <div className="text-slate-400 text-[0.9rem]">Indexed</div><div>{info.indexed ? 'Yes' : 'No'}</div>
            <div className="text-slate-400 text-[0.9rem]">Source</div>
            <div className="text-slate-400 text-[0.9rem]">
              {info.exists_pdf ? (
                <a className="text-sky-400 hover:underline" href={`${BASE}/uploads/${fileId}.pdf`} target="_blank" rel="noreferrer">Open PDF</a>
              ) : (
                <>
                  <a className="text-sky-400 hover:underline" href={`${BASE}/uploads/${fileId}.png`} target="_blank" rel="noreferrer">Open PNG</a> <span className="mx-1">/</span>
                  <a className="text-sky-400 hover:underline" href={`${BASE}/uploads/${fileId}.jpg`} target="_blank" rel="noreferrer">Open JPG</a> <span className="mx-1">/</span>
                  <a className="text-sky-400 hover:underline" href={`${BASE}/uploads/${fileId}.txt`} target="_blank" rel="noreferrer">Open TXT</a>
                </>
              )}
            </div>
            <div className="text-slate-400 text-[0.9rem]">Label</div>
            <div className="flex gap-1.5">
              <Input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Optional label" />
              <Button variant="outline" onClick={saveLabel} disabled={!fileId}>Save</Button>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-[0.9rem]">Select a file to view details.</div>
        )}
      </div>
      )}
  {noFiles && <div className="text-slate-400 text-[0.9rem] mt-1">Tip: you can also drag-and-drop a PDF into the upload box above.</div>}
    </div>
    <Modal open={confirmOpen} title="Delete document" onClose={()=>setConfirmOpen(false)} actions={
      <>
        <Button variant="destructive" onClick={()=>{ setConfirmOpen(false); handleDelete() }} disabled={!fileId || deleting}>Delete</Button>
        <Button variant="outline" onClick={()=>setConfirmOpen(false)}>Cancel</Button>
      </>
    }>
      <p>Delete this file and its index? This cannot be undone.</p>
    </Modal>
    </>
  )
}
