import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ThemeToggle from './ThemeToggle.jsx'
import DensityToggle from './DensityToggle.jsx'
import Badge from './ui/Badge.jsx'

export default function TopNav({ onSearch, nbId, nbTitle, models=[], modelDefault='', model='', onChangeModel }){
  return (
    <nav className="nav">
      <div className="nav-brand">
        <div className="nav-logo" aria-hidden="true" />
        <strong className="mr-1 gradient-text">StudyLM</strong>
        <a href="/#/dashboard" className="nav-link">Dashboard</a>
        <a href="/#/chat" className="nav-link">Workspace</a>
        <a href="/docs" target="_blank" rel="noreferrer" className="nav-link">Docs</a>
      </div>
      
      <div className="flex items-center gap-3">
        {nbId && (
          <Badge variant="outline" className="hidden sm:inline-flex">
            <span className="truncate max-w-32" title={nbId}>
              Notebook: <strong>{nbTitle || nbId.slice(0,8)+'…'}</strong>
            </span>
          </Badge>
        )}
        
        <button 
          className="btn-secondary flex items-center gap-2" 
          onClick={onSearch} 
          title="Search (Ctrl+K)"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
        
        <ThemeToggle />
        <DensityToggle />
        
        <button 
          className="btn-primary hover-lift" 
          onClick={(e)=> e.preventDefault()} 
          title="Upgrade plan"
        >
          Upgrade
        </button>
        
        <div 
          className="w-8 h-8 rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-white/5 cursor-pointer hover:scale-105 transition-transform" 
          aria-label="Account" 
          title="Account" 
        />
      </div>
    </nav>
  )
}
