import React, { useEffect, useMemo, useState } from 'react'

export default function Notes({ base = '' }) {
  const [fileId, setFileId] = useState('')
  const [files, setFiles] = useState([])
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    async function loadFiles() {
      try {
        const res = await fetch(`${base}/files`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (alive) {
          const list = data.files || []
          setFiles(list)
          // Auto-select first file to reduce friction
          if (!fileId && list.length) setFileId(list[0].file_id)
        }
      } catch {
        // ignore
      }
    }
    loadFiles()
    return () => { alive = false }
  }, [base])

  useEffect(() => {
    if (!fileId) return
    ;(async () => {
      await loadNotes()
    })()
  }, [fileId])

  const selectedLabel = useMemo(() => {
    const f = files.find(f => f.file_id === fileId)
    return (f && (f.label || f.file)) || ''
  }, [files, fileId])

  async function save() {
    if (!fileId || !note.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${base}/save_note`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, note: note.trim() })
      })
      if (!res.ok) throw new Error(await res.text())
      setNote('')
      await loadNotes()
  // brief success indicator
  setSaved(true)
  setTimeout(() => setSaved(false), 1200)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  async function loadNotes() {
    if (!fileId) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${base}/notes/${fileId}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setNotes(data.notes || [])
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  return (
    <div className="container-custom py-6">
      <h2 className="text-xl font-bold mb-3">Notes</h2>
      <div className="flex items-center gap-2 mb-3">
        <select value={fileId} onChange={e=>setFileId(e.target.value)} className="input w-72">
          <option value="">Select a file…</option>
          {files.map(f => (
            <option key={f.file_id} value={f.file_id}>{f.label || f.file}</option>
          ))}
        </select>
        <button onClick={loadNotes} disabled={!fileId} className="btn btn-secondary">Load</button>
        {fileId && (
          <a href={`/uploads/${fileId}.pdf`} target="_blank" rel="noreferrer" className="ml-auto text-sm text-sky-600 dark:text-sky-400">Open PDF ↗</a>
        )}
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
        <div className="card p-3">
          <div className="flex items-center mb-2">
            <strong className="text-sm">New note</strong>
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">{selectedLabel || '—'}</div>
          </div>
          <textarea
            placeholder="Write a note… (context, takeaway, question, etc.)"
            value={note}
            onChange={(e)=>setNote(e.target.value)}
            onKeyDown={(e)=>{ if ((e.ctrlKey||e.metaKey) && e.key==='Enter' && fileId && note.trim() && !loading) save() }}
            rows={4}
            className="input"
            style={{ height: 'auto' }}
          />
          <div className="flex justify-end mt-2 gap-2">
            <button onClick={()=>setNote('')} disabled={!note} className="btn btn-outline">Clear</button>
            <button onClick={save} disabled={!fileId || !note.trim() || loading} className="btn btn-primary">
              {loading ? 'Saving…' : 'Save note'}
            </button>
          </div>
          {saved && <div className="text-xs text-green-600 mt-2">Saved</div>}
        </div>

        <div className="card p-3">
          <div className="flex items-center mb-2">
            <strong className="text-sm">Saved notes</strong>
            <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">{notes.length} item(s)</div>
          </div>
          {!fileId ? (
            <p className="text-gray-500 dark:text-gray-400">Select a file to view notes.</p>
          ) : loading && notes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No notes yet for this file.</p>
          ) : (
            <ul className="list-none m-0 p-0">
              {notes.map((n, i) => (
                <li key={i} className="border rounded-lg p-2 mb-2" style={{ borderColor: 'hsl(var(--border))' }}>
                  <div className="text-sm whitespace-pre-wrap">{n}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  )
}
