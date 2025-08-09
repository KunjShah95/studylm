import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastCtx = createContext({ push: ()=>{} })

export function ToastProvider({ children }){
  const [items, setItems] = useState([])
  const push = useCallback((msg, variant='info') => {
    const id = Math.random().toString(36).slice(2)
    setItems(list => [...list, { id, msg, variant }])
    setTimeout(()=> setItems(list => list.filter(x => x.id !== id)), 3500)
  }, [])
  const api = useMemo(()=>({ push }), [push])
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-[2000]" role="status" aria-live="polite">
        {items.map(t => (
          <div key={t.id} className={
            `px-3 py-2 rounded border shadow-[0_10px_24px_rgba(0,0,0,.35)] bg-white/10 border-white/10 `+
            (t.variant==='success' ? 'border-emerald-400/50' : t.variant==='error' ? 'border-red-500/50' : '')
          }>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast(){ return useContext(ToastCtx) }
