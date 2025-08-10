import React from 'react'

export default function TopBar({ title, onToggleSidebar, theme, setTheme }) {
  return (
    <header className="topbar" style={{
      position: 'sticky', top: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1rem', borderBottom: '1px solid hsl(var(--border))',
      background: 'hsl(var(--background))'
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button aria-label="Toggle sidebar" onClick={onToggleSidebar} className="btn btn-secondary btn-scale" style={{ padding: '0.25rem 0.5rem' }}>☰</button>
        <strong style={{ fontSize: 16 }}>StudyLM</strong>
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>/ {title}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
  <select aria-label="Theme" value={theme} onChange={(e)=>setTheme(e.target.value)} className="input" style={{ height: 32, padding: '0.25rem 0.5rem', width: 140 }}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>
    </header>
  )
}
