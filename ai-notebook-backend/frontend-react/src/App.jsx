import React, { useEffect, useState, useRef } from 'react'
import { Chat } from './components/Chat.jsx'
import { Notes } from './components/Notes.jsx'
import { Upload } from './components/Upload.jsx'
import { Files } from './components/Files.jsx'
import { Notebooks } from './components/Notebooks.jsx'
import { Facts } from './components/Facts.jsx'
import NotebookSettings from './components/NotebookSettings.jsx'
import TopNav from './components/TopNav.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from './components/ToastProvider.jsx'
import Sidebar from './components/Sidebar.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import Empty from './components/Empty.jsx'
import Button from './components/ui/button.jsx'
import Card from './components/ui/Card.jsx'
import Study from './components/Study.jsx'
import Dashboard from './components/layout/Dashboard.jsx'
import NotificationCenter from './components/common/NotificationCenter.jsx'
import { useKeyboard } from './hooks/useKeyboard.js'

const BASE = import.meta.env.VITE_BACKEND_URL || window.location.origin

export default function App() {
  const toast = useToast()
  const notificationRef = useRef()
  const [fileId, setFileId] = useState('')
  const [status, setStatus] = useState({ ready: false, error: null })
  const [files, setFiles] = useState([])
  const [nbId, setNbId] = useState('')
  const [nbTitle, setNbTitle] = useState('')
  const [useNotebook, setUseNotebook] = useState(false)
  const [nbSources, setNbSources] = useState([])
  const [includeSources, setIncludeSources] = useState([])
  const [tab, setTab] = useState('dashboard')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [model, setModel] = useState('')
  const [models, setModels] = useState([])
  const [modelDefault, setModelDefault] = useState('')

  // Enhanced notification system
  const notify = {
    success: (message, options) => notificationRef.current?.success(message, options),
    error: (message, options) => notificationRef.current?.error(message, options),
    warning: (message, options) => notificationRef.current?.warning(message, options),
    info: (message, options) => notificationRef.current?.info(message, options),
  }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function refreshFiles() {
    try {
      const data = await fetchJSON(`${BASE}/files`)
      setFiles(data.files || [])
    } catch (e) { console.error(e) }
  }

  async function pollStatus(id) {
    try {
      const s = await fetchJSON(`${BASE}/status/${id}`)
      setStatus(s)
      return s.ready
    } catch (e) { setStatus({ ready: false, error: String(e) }); return false }
  }

  useEffect(() => { refreshFiles() }, [])

  // Enhanced keyboard shortcuts
  useKeyboard({ key: 'k', ctrl: true, meta: true }, () => setPaletteOpen(true))
  useKeyboard('escape', () => setPaletteOpen(false))

  // Fetch models once
  useEffect(()=>{
    (async()=>{
      try{
        const res = await fetch(`${BASE}/models`)
        if(res.ok){
          const data = await res.json()
          const allowed = data?.chat?.allowed || []
          setModels(allowed)
          setModelDefault(data?.chat?.default || '')
          try{
            const saved = localStorage.getItem('studylm_model') || ''
            if(saved && (saved==='' || allowed.includes(saved))){ setModel(saved) }
          }catch{}
        }
      }catch{}
    })()
  }, [BASE])

  // Load notebook details when nbId changes
  useEffect(() => {
    (async () => {
      if (!nbId) { setNbSources([]); setIncludeSources([]); return }
      try {
        const nb = await fetchJSON(`${BASE}/notebooks/${nbId}`)
        const srcs = nb.sources || []
        setNbSources(srcs)
        setIncludeSources(srcs)
        setNbTitle(nb.title || '')
      } catch (e) { console.error(e); setNbSources([]); setIncludeSources([]) }
    })()
  }, [nbId])

  // Hash-based tab routing
  useEffect(() => {
    const applyFromHash = () => {
      const h = (location.hash || '').replace(/^#\/?/, '')
      if (!h) return
      const key = h.split('?')[0]
      const known = ['dashboard', 'chat', 'notebooks', 'study', 'notes', 'facts', 'settings']
      if (known.includes(key)) setTab(key)
    }
    applyFromHash()
    window.addEventListener('hashchange', applyFromHash)
    return () => window.removeEventListener('hashchange', applyFromHash)
  }, [])

  useEffect(() => {
    location.hash = `/${tab}`
    try { localStorage.setItem('studylm_tab', tab) } catch { }
  }, [tab])

  // Restore last tab and notebook-toggle
  useEffect(() => {
    try {
      const last = localStorage.getItem('studylm_tab'); if (last) setTab(last)
      const nbToggle = localStorage.getItem('studylm_useNotebook'); if (nbToggle) { setUseNotebook(nbToggle === '1') }
    } catch { }
  }, [])

  return (
    <div className="text-white">
      <TopNav onSearch={() => setPaletteOpen(true)} nbTitle={nbTitle} nbId={nbId} models={models} modelDefault={modelDefault} model={model} onChangeModel={(m)=>{ setModel(m); try{ localStorage.setItem('studylm_model', m||'') }catch{} }} />
      <div className="grid grid-cols-[minmax(220px,300px)_1fr] gap-6 max-w-[98vw] mx-auto my-3 px-5 min-h-[calc(100vh-64px-1.5rem)]">
        <Sidebar current={tab} onChange={setTab} />
        <div className="grid grid-cols-[minmax(340px,520px)_1fr] gap-6 h-full">
          <main className="relative z-[1] grid grid-cols-[minmax(340px,520px)_1fr] gap-6 h-full">
            <section className="flex flex-col gap-6 overflow-auto min-h-0 stagger-children" aria-label="Sidebar">
              <Card className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                <Upload BASE={BASE} onUploaded={(id) => { setFileId(id); refreshFiles(); notify.success('File uploaded successfully'); }} models={models} model={model} modelDefault={modelDefault} onChangeModel={(m)=>{ setModel(m); try{ localStorage.setItem('studylm_model', m||'') }catch{} }} />
              </Card>
              <Card className="animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
                <Notebooks BASE={BASE} nbId={nbId} onSelect={setNbId} />
              </Card>
              <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <NotebookSettings BASE={BASE} nbId={nbId} />
              </Card>
              <Card className="animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
                <Files BASE={BASE} files={files} fileId={fileId} onSelect={(id) => { setFileId(id); }} status={status} onRefresh={refreshFiles} />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <label className="text-sm text-slate-300">Attach to notebook</label>
                  <Button 
                    size="sm"
                    disabled={!nbId || !fileId} 
                    onClick={async () => {
                      if (!nbId || !fileId) return
                      try {
                        await (await fetch(`${BASE}/notebooks/${nbId}/sources`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: fileId }) })).json()
                        const next = Array.from(new Set([...(nbSources || []), fileId]))
                        setNbSources(next)
                        setIncludeSources(next)
                        notify.success('Source attached to notebook')
                      } catch (e) { 
                        console.error(e)
                        notify.error('Failed to attach source')
                      }
                    }}
                  >
                    Attach
                  </Button>
                  <label className="ml-auto inline-flex gap-1.5 items-center text-sm">
                    <input 
                      type="checkbox" 
                      checked={useNotebook} 
                      onChange={e => { 
                        setUseNotebook(e.target.checked); 
                        try { localStorage.setItem('studylm_useNotebook', e.target.checked ? '1' : '0') } catch { } 
                      }} 
                      className="rounded border-white/20 bg-white/5 text-sky-400 focus:ring-sky-400"
                    /> 
                    Chat with notebook
                  </label>
                </div>
              </Card>
              {tab !== 'facts' && (
                <Card className="animate-fade-in-up" style={{ animationDelay: '0.18s' }}>
                  <Facts BASE={BASE} nbId={nbId} />
                </Card>
              )}
              {tab !== 'notes' && (
                <Card className="animate-fade-in-up" style={{ animationDelay: '0.22s' }}>
                  <Notes BASE={BASE} fileId={fileId} />
                </Card>
              )}
            </section>
            <Card className="min-h-[720px] flex flex-col overflow-hidden animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
              <AnimatePresence mode="wait">
                {tab === 'dashboard' && (
                  <motion.div key="dashboard" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <Dashboard 
                      files={files}
                      nbId={nbId}
                      nbTitle={nbTitle}
                      onNavigate={setTab}
                      stats={{
                        filesCount: files.length,
                        notebooksCount: nbId ? 1 : 0,
                        chatMessages: 0
                      }}
                    />
                  </motion.div>
                )}
                {tab === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <Chat BASE={BASE} fileId={fileId} pollStatus={pollStatus} status={status} useNotebook={useNotebook} nbId={nbId} includeSources={includeSources} model={model} />
                  </motion.div>
                )}
                {tab === 'notebooks' && (
                  <div>
                    <h2 className="text-lg font-semibold">Notebooks</h2>
                    <div className="flex items-center gap-2 mb-2">
                      <Notebooks BASE={BASE} nbId={nbId} onSelect={setNbId} />
                    </div>
                    <NotebookSettings BASE={BASE} nbId={nbId} />
                  </div>
                )}
                {tab === 'notes' && (
                  <motion.div key="notes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <Notes BASE={BASE} fileId={fileId} />
                  </motion.div>
                )}
                {tab === 'study' && (
                  <motion.div key="study" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <Study
                      BASE={BASE}
                      nbId={nbId}
                      files={files}
                      attached={nbSources}
                      includeSources={includeSources}
                      setIncludeSources={setIncludeSources}
                    />
                  </motion.div>
                )}
                {tab === 'facts' && (
                  <motion.div key="facts" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <Facts BASE={BASE} nbId={nbId} />
                  </motion.div>
                )}
                {tab === 'settings' && (
                  <div>
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <p className="text-slate-400 text-[0.9rem]">Per-notebook LLM settings</p>
                    <NotebookSettings BASE={BASE} nbId={nbId} />
                  </div>
                )}
              </AnimatePresence>
            </Card>
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onRun={async (cmd) => {
        try {
          if (cmd === 'upload') {
            document.querySelector('input[type=file]')?.click()
          } else if (cmd === 'new-notebook') {
            setTab('notebooks')
          } else if (cmd === 'clear-chat') {
            if (!nbId) return notify.error('Select a notebook first')
            await fetch(`${BASE}/notebooks/${nbId}/history`, { method: 'DELETE' })
            notify.success('Chat cleared')
          } else if (cmd === 'attach-source') {
            if (!nbId || !fileId) return notify.error('Pick a notebook and file')
            await fetch(`${BASE}/notebooks/${nbId}/sources`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: fileId }) })
            const next = Array.from(new Set([...(nbSources || []), fileId])); setNbSources(next); setIncludeSources(next)
            notify.success('Source attached')
          }
        } catch (e) { 
          console.error(e)
          notify.error('Action failed')
        }
      }} />
      <NotificationCenter ref={notificationRef} />
    </div>
  )
}
