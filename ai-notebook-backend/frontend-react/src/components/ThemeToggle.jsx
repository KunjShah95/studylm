import React, { useEffect, useState } from 'react'

export default function ThemeToggle(){
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  useEffect(()=>{
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])
  return (
  <button className="bg-transparent border border-white/20 text-white hover:bg-white/5 rounded-lg px-3.5 py-2" onClick={()=> setTheme(t => t==='dark' ? 'light' : 'dark')} title="Toggle theme">
      {theme==='dark' ? 'Light' : 'Dark'}
    </button>
  )
}
