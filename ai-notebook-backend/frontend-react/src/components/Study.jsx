import React, { useEffect, useState } from 'react'
import Empty from './Empty.jsx'
import Button from './ui/button.jsx'

export default function Study({ BASE, nbId, files=[], attached=[], includeSources=[], setIncludeSources }){
	const [study, setStudy] = useState({})
	const [busy, setBusy] = useState(false)
	const [msg, setMsg] = useState('')

	async function fetchJSON(url, opts){
		const res = await fetch(url, opts)
		if(!res.ok) throw new Error(await res.text())
		return res.json()
	}

	async function refresh(){
		if(!nbId){ setStudy({}); return }
		try{
			const res = await fetchJSON(`${BASE}/notebooks/${nbId}/study`)
			setStudy(res.study || {})
		}catch(e){ setMsg(String(e.message||e)) }
	}

	async function summarize(kind){
		if(!nbId) return
		setBusy(true)
		setMsg('')
		try{
			await fetchJSON(`${BASE}/notebooks/${nbId}/summarize`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ kind, include_sources: includeSources }) })
			await refresh()
		}catch(e){ setMsg(String(e.message||e)) } finally{ setBusy(false) }
	}

	async function genFlashcards(){
		setBusy(true); setMsg('')
		try{ await fetchJSON(`${BASE}/notebooks/${nbId}/flashcards`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ count: 12, include_sources: includeSources }) }); await refresh() }catch(e){ setMsg(String(e.message||e)) } finally{ setBusy(false) }
	}

	async function genQuiz(){
		setBusy(true); setMsg('')
		try{ await fetchJSON(`${BASE}/notebooks/${nbId}/quiz`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ count: 8, include_sources: includeSources }) }); await refresh() }catch(e){ setMsg(String(e.message||e)) } finally{ setBusy(false) }
	}

	useEffect(()=>{ refresh() }, [nbId])

	function downloadCSV(){
		const items = (study.flashcards && study.flashcards.items) || []
		if(!items.length) return
		const rows = [['Question','Answer'], ...items.map(it => [it.q?.replaceAll('"','""')||'', it.a?.replaceAll('"','""')||''])]
		const csv = rows.map(r=> r.map(v => `"${v}` + `"`).join(',')).join('\n')
		const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a'); a.href = url; a.download = 'flashcards.csv'; a.click(); URL.revokeObjectURL(url)
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-2">
				<h2 className="text-lg font-semibold">Study tools</h2>
				<div className="inline-flex gap-2">
					<a className="bg-transparent border border-white/20 text-white hover:bg-white/5 rounded-lg px-3.5 py-2" target="_blank" rel="noreferrer" href={`${BASE}/notebooks/${nbId||''}/export.md`}>Export .md</a>
				</div>
			</div>
			{ !nbId ? (
				<Empty title="No notebook selected" subtitle="Pick or create a notebook to generate summaries, flashcards, and quizzes." />
			) : (
				<>
				<div className="flex items-center gap-2 my-2">
						<label>Sources</label>
						<div className="flex flex-wrap gap-1.5 items-center">
							<Button variant="ghost" type="button" onClick={()=> setIncludeSources(attached.slice())}>All</Button>
							<Button variant="ghost" type="button" onClick={()=> setIncludeSources([])}>None</Button>
						{(attached||[]).map(fid=>{
							const meta = (files||[]).find(f => (f.file_id||'')===fid)
							const name = meta?.file || `${fid}.pdf`
							const checked = includeSources.includes(fid)
							return (
								<label key={fid} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.8rem] border border-white/20 cursor-pointer">
									<input type="checkbox" checked={checked} onChange={e=>{
										const next = e.target.checked ? Array.from(new Set([...includeSources, fid])) : includeSources.filter(x=>x!==fid)
										setIncludeSources(next)
									}} /> {name}
								</label>
							)
						})}
					</div>
				</div>
				<div className="flex items-center gap-2 my-2">
					<Button disabled={busy} onClick={()=>summarize('overview')}>Overview</Button>
					<Button variant="ghost" disabled={busy} onClick={()=>summarize('key_points')}>Key points</Button>
					<Button variant="ghost" disabled={busy} onClick={()=>summarize('outline')}>Outline</Button>
					<Button variant="ghost" disabled={busy} onClick={()=>summarize('glossary')}>Glossary</Button>
				</div>
				<div className="flex flex-col gap-1.5">
					{['overview','key_points','outline','glossary'].map(k => (
							<div key={k} className="bg-white/10 border border-white/20 rounded px-3 py-2">
							<div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
								<strong style={{textTransform:'capitalize'}}>{k.replace('_',' ')}</strong>
									{!study[k] && <span className="text-slate-400 text-[0.9rem]">(none)</span>}
							</div>
							{study[k]?.markdown && <div style={{whiteSpace:'pre-wrap'}}>{study[k].markdown}</div>}
						</div>
					))}
				</div>
				<div className="flex items-center gap-2 my-2">
					<Button disabled={busy} onClick={genFlashcards}>Generate flashcards</Button>
					<Button variant="ghost" disabled={busy || !(study.flashcards?.items?.length)} onClick={downloadCSV}>Export CSV</Button>
				</div>
				<div className="flex flex-col gap-1.5">
					<div className="bg-white/10 border border-white/20 rounded px-3 py-2">
						<strong>Flashcards</strong>
						{(study.flashcards?.items||[]).length ? (
							<ol>
								{(study.flashcards.items).map((it, i)=>(
									<li key={i} style={{marginBottom:'.3rem'}}>
										<div><strong>Q:</strong> {it.q}</div>
										<div><strong>A:</strong> {it.a}</div>
									</li>
								))}
							</ol>
						) : <div className="text-slate-400 text-[0.9rem]">(none)</div>}
					</div>
				</div>
				<div className="flex items-center gap-2 my-2">
					<Button disabled={busy} onClick={genQuiz}>Generate quiz</Button>
				</div>
				<div className="flex flex-col gap-1.5">
					<div className="bg-white/10 border border-white/20 rounded px-3 py-2">
						<strong>Quiz</strong>
						{(study.quiz?.items||[]).length ? (
							<ol>
								{(study.quiz.items).map((it, i)=>(
									<li key={i} style={{marginBottom:'.35rem'}}>
										<div style={{marginBottom:'.25rem'}}>{it.question}</div>
										<ul>
											{(it.options||[]).map((opt, j)=> (
												<li key={j}>{String.fromCharCode(65+j)}. {opt} {typeof it.answer==='number' && it.answer===j ? <strong>(answer)</strong> : null}</li>
											))}
										</ul>
									</li>
								))}
							</ol>
						) : <div className="text-slate-400 text-[0.9rem]">(none)</div>}
					</div>
				</div>
				</>
			)}
			{msg && <div className="text-slate-400 text-[0.9rem]">{msg}</div>}
		</div>
	)
}
