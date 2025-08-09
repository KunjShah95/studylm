import React, { useEffect, useState } from 'react'

export default function DensityToggle(){
  const [density, setDensity] = useState(() => localStorage.getItem('density') || 'comfortable')
  useEffect(()=>{
    if(density==='compact') document.documentElement.dataset.density = 'compact'
    else delete document.documentElement.dataset.density
    localStorage.setItem('density', density)
  }, [density])
  return (
  <button className="bg-transparent border border-white/20 text-white hover:bg-white/5 rounded-lg px-3.5 py-2" onClick={()=> setDensity(d => d==='comfortable' ? 'compact' : 'comfortable')} title="Toggle density">
      {density==='comfortable' ? 'Compact' : 'Comfortable'}
    </button>
  )
}
