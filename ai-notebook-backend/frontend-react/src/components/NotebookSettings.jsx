import React, { useEffect, useState } from 'react'
import Button from './ui/button.jsx'

export default function NotebookSettings({ BASE, nbId }){
	const [settings, setSettings] = useState({})
	const [msg, setMsg] = useState('')
	const [saving, setSaving] = useState(false)
	const [models, setModels] = useState([])
	const [modelDefault, setModelDefault] = useState('')

	async function fetchJSON(url, opts){
		const res = await fetch(url, opts)
		if(!res.ok) throw new Error(await res.text())
		return res.json()
	}

	async function refresh(){
		if(!nbId){ setSettings({}); return }
		try{
			const res = await fetchJSON(`${BASE}/notebooks/${nbId}/settings`)
			setSettings(res.settings || {})
		}catch(e){ setMsg(String(e.message||e)) }
	}

	async function save(){
		if(!nbId) return
		setSaving(true); setMsg('')
		try{
			const body = { ...settings }
			if(body.temperature!==undefined && body.temperature!==''){ body.temperature = parseFloat(body.temperature) }
			if(body.max_tokens!==undefined && body.max_tokens!==''){ body.max_tokens = parseInt(body.max_tokens) }
			await fetchJSON(`${BASE}/notebooks/${nbId}/settings`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
		}catch(e){ setMsg(String(e.message||e)) } finally{ setSaving(false) }
	}

	useEffect(()=>{ refresh() }, [nbId])

	useEffect(()=>{ // fetch allowed models for dropdown
		(async()=>{
			try{
				const res = await fetch(`${BASE}/models`)
				if(res.ok){
					const data = await res.json()
					setModels(data?.chat?.allowed || [])
					setModelDefault(data?.chat?.default || '')
				}
			}catch{}
		})()
	}, [BASE])

	return (
		<div>
			<h2 className="mt-1 mb-2 text-lg font-semibold">Notebook settings</h2>
			{!nbId ? (<div className="text-slate-400 text-[0.9rem]">Select a notebook.</div>) : (
				<>
					<div className="flex items-center gap-2 my-2">
						<label title={modelDefault?`Server default: ${modelDefault}`:'Server default model'}>Default LLM</label>
						<select className="h-9 rounded-md bg-white/10 border border-white/25 text-white px-2 focus:outline-none focus:ring-2 focus:ring-sky-400" value={settings.chat_model||''} onChange={e=>setSettings(s=>({...s, chat_model: e.target.value || null}))} aria-label="Select default LLM">
							<option value="">(server default{modelDefault?`: ${modelDefault}`:''})</option>
							{models.map(m => (<option key={m} value={m}>{m}</option>))}
						</select>
					</div>
					<div className="flex items-center gap-2 my-2">
						<label>Temperature</label>
						<input className="h-9 rounded-md bg-white/10 border border-white/25 text-white px-2 focus:outline-none focus:ring-2 focus:ring-sky-400" type="number" step="0.05" value={(settings.temperature ?? '')} onChange={e=>setSettings(s=>({...s, temperature: e.target.value}))} />
					</div>
					<div className="flex items-center gap-2 my-2">
						<label>Max tokens</label>
						<input className="h-9 rounded-md bg-white/10 border border-white/25 text-white px-2 focus:outline-none focus:ring-2 focus:ring-sky-400" type="number" step="1" value={(settings.max_tokens ?? '')} onChange={e=>setSettings(s=>({...s, max_tokens: e.target.value}))} />
					</div>
					<div className="flex items-center gap-2 my-2">
						<Button disabled={saving} onClick={save}>Save</Button>
					</div>
				</>
			)}
			{msg && <div className="text-slate-400 text-[0.9rem]">{msg}</div>}
		</div>
	)
}
