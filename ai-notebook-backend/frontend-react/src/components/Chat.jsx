import React, { useEffect, useRef, useState } from 'react'
import Button from './ui/button.jsx'
import Input from './ui/input.jsx'

function Markdown({ text='' }){
  // Lightweight markdown: paragraphs + code fences
  const lines = text.split('\n')
  const out = []
  let inCode = false
  let code = []
  for(const ln of lines){
    if(ln.trim().startsWith('```')){
    if(inCode){ out.push(<pre key={out.length} className="bg-black/30 border border-white/10 rounded-lg p-3 overflow-x-auto text-sm"><code className="font-mono whitespace-pre">{code.join('\n')}</code></pre>); code=[]; inCode=false }
      else { inCode=true }
      continue
    }
    if(inCode){ code.push(ln); continue }
    out.push(<p key={out.length}>{ln}</p>)
  }
  if(code.length){ out.push(<pre key={out.length} className="bg-black/30 border border-white/10 rounded-lg p-3 overflow-x-auto text-sm"><code className="font-mono whitespace-pre">{code.join('\n')}</code></pre>) }
  return <>{out}</>
}

function Bubble({ who, children }){
  const base = 'max-w-[min(98%,1100px)] px-5 py-3 rounded-2xl leading-7 border border-white/10'
  const cls = who === 'user'
    ? `${base} self-end bg-gradient-to-br from-sky-400 to-sky-500 text-black border-sky-400/50`
    : `${base} self-start bg-white/10`
  return <div className={cls}>{children}</div>
}

export function Chat({ BASE, fileId, pollStatus, status, useNotebook=false, nbId='', includeSources=[], model='' }){
  const [q, setQ] = useState('')
  const [messages, setMessages] = useState([{ who:'bot', text:'Ask a question about your document to get started.' }])
  const [cites, setCites] = useState([])
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)
  const [highlightIdx, setHighlightIdx] = useState(null)

  async function fetchJSON(url, opts){
    const res = await fetch(url, opts)
    if(!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function ask(){
    if((!useNotebook && !fileId) || !q.trim() || busy) return
    setBusy(true)
    setMessages(m => [...m, { who:'user', text:q } , { who:'bot', text:'Checking readiness...' }])
    setQ('')
    if(!useNotebook){
      let ready = await pollStatus(fileId)
      if(!ready){
        for(let i=0;i<12 && !ready;i++){
          await new Promise(r => setTimeout(r, 1000))
          ready = await pollStatus(fileId)
        }
      }
      if(!ready){
        setMessages(m => m.map((b,i)=> i===m.length-1 ? {...b, text:'Document not ready yet. Try again in a bit.'} : b))
        setBusy(false)
        return
      }
    }
  setMessages(m => m.map((b,i)=> i===m.length-1 ? {...b, text:'' , typing:true} : b))
    try{
      let res
    if(useNotebook && nbId){
        res = await fetchJSON(`${BASE}/notebooks/${nbId}/ask`, {
          method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ question:q, chat_model:(model||undefined), include_sources: includeSources })
        })
      }else{
        res = await fetchJSON(`${BASE}/ask`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ file_id:fileId, question:q, chat_model:(model||undefined) })
        })
      }
  const citations = res.citations || []
  // Attach citations to this bot message, and also keep a sidebar copy
  setMessages(m => m.map((b,i)=> i===m.length-1 ? {...b, text: res.answer || '(no answer)', typing:false, cites: citations} : b))
  setCites(citations)
    }catch(e){
      setMessages(m => m.map((b,i)=> i===m.length-1 ? {...b, text: String(e.message||e), typing:false} : b))
      setCites([])
    }finally{ setBusy(false) }
  }

  useEffect(()=>{
    // auto-scroll
    scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight)
  }, [messages])

  useEffect(()=>{
    // transient highlight on citation jump
    if(highlightIdx!==null){
      const t = setTimeout(()=> setHighlightIdx(null), 800)
      return ()=> clearTimeout(t)
    }
  }, [highlightIdx])

  // model is driven by parent (TopNav)

  function keyHandler(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); ask() } }

  const suggestions = [
    'Summarize the main findings',
    'List key terms and definitions',
  'What are the limitations?'
  ]

  function copyLast(){
    const last = [...messages].reverse().find(m=>m.who==='bot')
    if(last){ navigator.clipboard.writeText(last.text||'') }
  }

  return (
    <div className="flex flex-col min-h-0" aria-label="Chat area">
      {status?.stage && (
        <div className="mb-2"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.8rem] border border-white/20 bg-white/10">Stage: <span className="font-mono">{status.stage}</span></span></div>
      )}
  <div className="flex-1 overflow-auto flex flex-col gap-2 p-1 pb-20" ref={scrollRef} role="log" aria-live="polite"> 
        {messages.map((m,i)=>{
          const text = m.text
          // Simple render: show message text and, for bot messages, append inline refs ¹²³...
    const refs = (m.who==='bot' && (m.cites?.length)) ? (
            <sup style={{ marginLeft: '.25rem' }}>
              {m.cites.map((_, idx)=> (
                <a key={idx} href="#citation-list" onClick={(e)=>{
                  e.preventDefault();
                  const el = document.getElementById(`cite-${idx+1}`)
      if(el){ el.scrollIntoView({ behavior:'smooth', block:'center' }); setHighlightIdx(idx) }
                }} style={{ marginLeft: idx?4:0 }}>{idx+1}</a>
              ))}
            </sup>
          ) : null
          return (
            <Bubble key={i} who={m.who}>
              {m.typing ? (
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{animationDelay:'0ms'}}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{animationDelay:'150ms'}}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{animationDelay:'300ms'}}></span>
                </span>
              ) : (
                <>
                  <Markdown text={text} />
                  {refs}
                </>
              )}
            </Bubble>
          )
        })}
      </div>
  <div className="flex gap-2 items-center mt-2 sticky bottom-0 bg-slate-900/80 pt-2 z-10">
        <Input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={keyHandler} placeholder="Ask anything about your document…" />
        <Button onClick={ask} disabled={busy}>Ask</Button>
        <Button variant="ghost" onClick={copyLast} title="Copy last answer">Copy</Button>
      </div>
      {!fileId && !useNotebook && (
        <div className="text-slate-400 text-[0.9rem] mt-1">Tip: upload a PDF or select a file to begin. Or enable "Chat with notebook" to use multiple sources.</div>
      )}
      {!busy && q.trim()==='' && (
        <div className="text-slate-400 text-[0.9rem] mt-1 flex gap-1.5 flex-wrap">
          {suggestions.map((s, i)=> (
            <Button key={i} variant="ghost" onClick={()=>{ setQ(s); setTimeout(ask, 0) }}>{s}</Button>
          ))}
        </div>
      )}
  <div id="citations" className="text-slate-400 text-[0.9rem] mt-2">
        {cites.length>0 && (<div>
          <div id="citation-list"><strong>Sources:</strong></div>
          {cites.map((c,idx)=>{
            const pg = (c.page_start===c.page_end || !c.page_end) ? `${c.page_start}` : `${c.page_start}-${c.page_end}`
            return (
              <div key={idx} className={`transition ring-0 ${highlightIdx===idx? 'ring-2 ring-sky-400 rounded-md':''}`} id={`cite-${idx+1}`}>
                <strong>[{idx+1}]</strong> {c.url ? <a className="text-sky-400 hover:underline" href={c.url} target="_blank" rel="noreferrer">p. {pg}</a> : `p. ${pg}`} — <span className="font-mono">{(c.preview||'').slice(0,240)}</span>
              </div>
            )
          })}
        </div>)}
      </div>
    </div>
  )
}
