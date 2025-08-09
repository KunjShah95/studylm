import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'

// Components
import { Chat } from './components/Chat.jsx'
import { Notes } from './components/Notes.jsx'
import { Upload } from './components/Upload.jsx'
import { Files } from './components/Files.jsx'
import { Notebooks } from './components/Notebooks.jsx'
import { Facts } from './components/Facts.jsx'
import NotebookSettings from './components/NotebookSettings.jsx'
import TopNav from './components/TopNav.jsx'
import Sidebar from './components/Sidebar.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import Empty from './components/Empty.jsx'
import Study from './components/Study.jsx'

// UI Components
import { LoadingSpinner, PageSpinner } from './components/ui/spinner'
import { Card, CardContent } from './components/ui/card'

// Utils
import { cn, getSystemTheme } from './lib/utils'

const BASE = import.meta.env.VITE_BACKEND_URL || window.location.origin

export default function App() {
  // State management
  const [fileId, setFileId] = useState('')
  const [status, setStatus] = useState({ ready: false, error: null })
  const [files, setFiles] = useState([])
  const [nbId, setNbId] = useState('')
  const [nbTitle, setNbTitle] = useState('')
  const [useNotebook, setUseNotebook] = useState(false)
  const [nbSources, setNbSources] = useState([])
  const [includeSources, setIncludeSources] = useState([])
  const [tab, setTab] = useState('chat')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [model, setModel] = useState('')
  const [models, setModels] = useState([])
  const [modelDefault, setModelDefault] = useState('')
  const [theme, setTheme] = useState('system')
  const [loading, setLoading] = useState(true)

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('studylm_theme') || 'system'
    setTheme(savedTheme)
    
    const applyTheme = (theme) => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      
      if (theme === 'system') {
        const systemTheme = getSystemTheme()
        root.classList.add(systemTheme)
      } else {
        root.classList.add(theme)
      }
    }
    
    applyTheme(savedTheme)
  }, [])

  useEffect(() => {
    localStorage.setItem('studylm_theme', theme)
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = getSystemTheme()
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // API utilities
  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function refreshFiles() {
    try {
      const data = await fetchJSON(`${BASE}/files`)
      setFiles(data.files || [])
    } catch (e) { 
      console.error(e)
      toast.error('Failed to load files')
    }
  }

  async function pollStatus(id) {
    try {
      const s = await fetchJSON(`${BASE}/status/${id}`)
      setStatus(s)
      return s.ready
    } catch (e) { 
      setStatus({ ready: false, error: String(e) })
      return false 
    }
  }

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true)
        await refreshFiles()
        
        // Fetch models
        try {
          const res = await fetch(`${BASE}/models`)
          if (res.ok) {
            const data = await res.json()
            const allowed = data?.chat?.allowed || []
            setModels(allowed)
            setModelDefault(data?.chat?.default || '')
            
            const saved = localStorage.getItem('studylm_model') || ''
            if (saved && (saved === '' || allowed.includes(saved))) {
              setModel(saved)
            }
          }
        } catch (e) {
          console.error('Failed to fetch models:', e)
        }
      } catch (e) {
        console.error('Failed to initialize app:', e)
        toast.error('Failed to initialize application')
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  // Load notebook details when nbId changes
  useEffect(() => {
    const loadNotebook = async () => {
      if (!nbId) { 
        setNbSources([])
        setIncludeSources([])
        return 
      }
      
      try {
        const nb = await fetchJSON(`${BASE}/notebooks/${nbId}`)
        const srcs = nb.sources || []
        setNbSources(srcs)
        setIncludeSources(srcs)
        setNbTitle(nb.title || '')
      } catch (e) { 
        console.error(e)
        setNbSources([])
        setIncludeSources([])
        toast.error('Failed to load notebook')
      }
    }

    loadNotebook()
  }, [nbId])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false)
        setSidebarOpen(false)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Render tab content
  const renderTabContent = () => {
    const contentProps = {
      fileId,
      setFileId,
      status,
      setStatus,
      files,
      refreshFiles,
      pollStatus,
      nbId,
      setNbId,
      nbTitle,
      setNbTitle,
      useNotebook,
      setUseNotebook,
      nbSources,
      setNbSources,
      includeSources,
      setIncludeSources,
      model,
      setModel,
      models,
      modelDefault,
      toast: {
        success: (msg) => toast.success(msg),
        error: (msg) => toast.error(msg),
        loading: (msg) => toast.loading(msg),
      }
    }

    const tabComponents = {
      chat: <Chat {...contentProps} />,
      upload: <Upload {...contentProps} />,
      files: <Files {...contentProps} />,
      notebooks: <Notebooks {...contentProps} />,
      notes: <Notes {...contentProps} />,
      facts: <Facts {...contentProps} />,
      study: <Study {...contentProps} />,
      settings: <NotebookSettings {...contentProps} />,
      analytics: <Empty title="Analytics" description="Usage insights and statistics coming soon" />
    }

    return tabComponents[tab] || <Empty title="Page Not Found" description="The requested page could not be found" />
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <PageSpinner text="Loading StudyLM..." />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        tab={tab}
        setTab={setTab}
        useNotebook={useNotebook}
        nbTitle={nbTitle}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          nbTitle={nbTitle}
          useNotebook={useNotebook}
          setPaletteOpen={setPaletteOpen}
          theme={theme}
          setTheme={setTheme}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="container-custom py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        setOpen={setPaletteOpen}
        setTab={setTab}
        files={files}
        setFileId={setFileId}
        setNbId={setNbId}
        refreshFiles={refreshFiles}
      />

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          success: {
            iconTheme: {
              primary: 'rgb(34 197 94)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'rgb(239 68 68)',
              secondary: 'white',
            },
          },
        }}
      />
    </div>
  )
}