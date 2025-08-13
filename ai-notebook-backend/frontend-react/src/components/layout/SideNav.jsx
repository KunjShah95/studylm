import React from 'react'

const items = [
  { key: 'home', label: 'Home' },
  { key: 'upload', label: 'Upload' },
  { key: 'files', label: 'Files' },
  { key: 'chat', label: 'Chat' },
  { key: 'notes', label: 'Notes' },
  { key: 'imageqa', label: 'Image Q&A' },
]

export default function SideNav({ current, onSelect, open }) {
  return (
    <aside style={{
      width: open ? 240 : 0,
      transition: 'width 150ms ease',
      overflow: 'hidden',
      borderRight: '1px solid hsl(var(--border))',
      background: 'hsl(var(--background))'
    }}>
      <nav style={{ padding: '0.75rem' }}>
        {items.map(it => (
          <button
            key={it.key}
            type="button"
            onClick={() => onSelect(it.key)}
            aria-current={current === it.key ? 'page' : undefined}
            className={`nav-item ${current === it.key ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', marginBottom: 4 }}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
