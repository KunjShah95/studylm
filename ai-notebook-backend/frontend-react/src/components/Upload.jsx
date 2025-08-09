import React, { useRef, useState } from 'react'
import { useToast } from './ToastProvider.jsx'
import Button from './ui/button.jsx'
import Input from './ui/input.jsx'

export function Upload({ BASE, onUploaded, models=[], model='', modelDefault='', onChangeModel }){
  const toast = useToast()
  const [msg, setMsg] = useState('')
  const [drag, setDrag] = useState(false)
  const [pct, setPct] = useState(0)
  const fileRef = useRef(null)

  async function sendFile(file){
    setMsg('Uploading...')
    setPct(10)
    const fd = new FormData()
    fd.append('file', file, file.name)
    try {
      const res = await fetch(`${BASE}/upload`, { method:'POST', body: fd })
      setPct(70)
      if(!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setPct(100)
      setMsg(`Queued: ${data.file_id}`)
      onUploaded?.(data.file_id)
      toast.push('Upload queued', 'success')
      setTimeout(()=>setPct(0), 800)
    } catch(e){ setMsg(String(e.message||e)); setPct(0); toast.push('Upload failed', 'error') }
  }

  async function onSubmit(e){
    e.preventDefault()
    const f = fileRef.current?.files?.[0]
    if(!f) return
    await sendFile(f)
  }

  function onDrop(e){
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if(f && f.type === 'application/pdf') sendFile(f)
    else setMsg('Please drop a PDF file')
  }

  return (
  <div>
      <h2 className="mt-1 mb-2 text-lg font-semibold">Upload PDF</h2>
      <div
        className={[
          'rounded-xl p-4 text-center transition-all border-2 border-dashed bg-white/5',
          drag ? 'border-sky-400 bg-sky-400/10' : 'border-white/30'
        ].join(' ')}
        onDragOver={(e)=>{e.preventDefault(); setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={onDrop}
      >
        <div className="text-slate-400 text-[0.9rem]">Drag & drop a PDF here or choose a file</div>
  <div className="grid grid-cols-1 md:[grid-template-columns:1fr_1.25fr] gap-3 my-3 items-start">
          <form onSubmit={onSubmit} className="flex items-center gap-2 justify-center md:justify-start">
            <Input ref={fileRef} name="file" type="file" accept="application/pdf" className="max-w-xs" />
            <Button type="submit">Upload</Button>
          </form>
          <div className="flex flex-col gap-1 text-left">
            <label htmlFor="upload-model" className="font-medium text-base md:text-lg">Global model</label>
            <select
              id="upload-model"
              className="h-16 text-2xl rounded-2xl bg-white/10 border border-white/25 text-white px-4 focus:outline-none focus:ring-2 focus:ring-sky-400 w-full shadow-[0_10px_30px_rgba(2,6,23,0.28)]"
              value={model}
              onChange={(e)=> onChangeModel && onChangeModel(e.target.value)}
              title={modelDefault?`Default: ${modelDefault}`:'Default model'}
            >
              <option value="">Model: Default{modelDefault?` (${modelDefault})`:''}</option>
              {models.map(m => (<option key={m} value={m}>Model: {m}</option>))}
            </select>
            <div className="text-slate-400 text-xs">Applies to chat, summaries, flashcards, and quizzes.</div>
          </div>
        </div>
        {pct>0 && (
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
            <span className="block h-full bg-gradient-to-br from-sky-400 to-sky-500" style={{width: pct+"%"}}></span>
          </div>
        )}
      </div>
      <div className="text-slate-400 text-[0.9rem] font-mono">{msg}</div>
      <div className="text-slate-400 text-[0.9rem] mt-1">Limits: 20MB, 200 pages (configurable)</div>
    </div>
  )
}
