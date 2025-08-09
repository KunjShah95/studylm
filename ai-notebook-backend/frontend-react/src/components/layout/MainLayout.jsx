import React from 'react'
import TopNav from '../TopNav.jsx'
import Sidebar from '../Sidebar.jsx'

export default function MainLayout({ 
  children, 
  sidebarContent,
  onSearch,
  nbId,
  nbTitle,
  models = [],
  modelDefault = '',
  model = '',
  onChangeModel,
  currentTab = 'dashboard',
  onTabChange
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav 
        onSearch={onSearch}
        nbId={nbId}
        nbTitle={nbTitle}
        models={models}
        modelDefault={modelDefault}
        model={model}
        onChangeModel={onChangeModel}
      />
      
      <div className="layout-grid">
        <Sidebar current={currentTab} onChange={onTabChange} />
        
        <div className="grid grid-cols-[minmax(340px,520px)_1fr] gap-6 h-full">
          <main className="relative z-[1] grid grid-cols-[minmax(340px,520px)_1fr] gap-6 h-full">
            {sidebarContent && (
              <section 
                className="flex flex-col gap-6 overflow-auto min-h-0 stagger-children" 
                aria-label="Sidebar"
              >
                {sidebarContent}
              </section>
            )}
            
            <section className="min-h-[720px] flex flex-col overflow-hidden card">
              {children}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}