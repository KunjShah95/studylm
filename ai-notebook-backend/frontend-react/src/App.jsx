import React, { useEffect, useState } from 'react'
import TopBar from './components/layout/TopBar.jsx'
import SideNav from './components/layout/SideNav.jsx'
import Home from './pages/Home.jsx'
import Upload from './pages/Upload.jsx'
import Files from './pages/Files.jsx'
import Chat from './pages/Chat.jsx'
import Notes from './pages/Notes.jsx'
import ImageQA from './pages/ImageQA.jsx'

// API base: allow override via VITE_API_BASE for static hosting (e.g., Vercel)
const envBase = (import.meta.env.VITE_API_BASE || '').toString().trim()
const BASE = envBase ? envBase.replace(/\/$/, '') : (import.meta.env.PROD ? '/api' : '')

export default function App() {
  const [page, setPage] = useState('home')
  const [sidebar, setSidebar] = useState(true)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const saved = localStorage.getItem('studylm_theme') || 'system'
    setTheme(saved)
  }, [])
  useEffect(() => {
    localStorage.setItem('studylm_theme', theme)
    const root = document.documentElement
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'dark' : 'light')
  }, [theme])

  const titleMap = { home: 'Home', upload: 'Upload', files: 'Files', chat: 'Chat', notes: 'Notes', imageqa: 'Image Q&A' }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <SideNav current={page} onSelect={setPage} open={sidebar} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <TopBar title={titleMap[page] || 'StudyLM'} onToggleSidebar={() => setSidebar(s => !s)} theme={theme} setTheme={setTheme} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {page === 'home' && <Home base={BASE} navigate={setPage} />}
          {page === 'upload' && <Upload base={BASE} />}
          {page === 'files' && <Files base={BASE} />}
          {page === 'chat' && <Chat base={BASE} />}
          {page === 'notes' && <Notes base={BASE} />}
          {page === 'imageqa' && <ImageQA base={BASE} />}
        </main>
      </div>
    </div>
  )
}