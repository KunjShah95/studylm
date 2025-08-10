import React, { useEffect, useState } from 'react'

export default function Files({ base = '' }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`${base}/files`)
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        if (alive) setFiles(data.files || [])
      } catch (e) {
        if (alive) setError('Failed to load files')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [base])

  const filtered = files.filter(f => {
    const q = search.trim().toLowerCase()
    return !q || f.file.toLowerCase().includes(q) || (f.label || '').toLowerCase().includes(q)
  })

  return (
    <div className="container-custom py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-1">Your Files</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Uploaded PDFs ready for Q&A and study tools.</p>
        </div>
        <input
          className="input w-full sm:w-64"
          placeholder="Search files..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Loading files…</div>
      ) : error ? (
        <div className="flex items-center justify-center h-40 text-error-600">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-center text-gray-400 gap-2">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><path fill="#bae6fd" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-4.828-4.828A2 2 0 0 0 13.172 2H6Zm6 1.414L18.586 10H16a2 2 0 0 1-2-2V3.414ZM6 4h6v4a4 4 0 0 0 4 4h4v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4Z"/></svg>
          <div className="font-semibold">No files found</div>
          <div className="text-sm">Upload a PDF to get started.</div>
        </div>
      ) : (
        <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map(f => (
            <li key={f.file_id} className="card card-hover flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#38bdf8" d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-4.828-4.828A2 2 0 0 0 13.172 2H6Zm6 1.414L18.586 10H16a2 2 0 0 1-2-2V3.414ZM6 4h6v4a4 4 0 0 0 4 4h4v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4Z"/></svg>
                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{f.label || f.file}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">ID: {f.file_id}</div>
              <a href={`${base}/uploads/${f.file}`} target="_blank" rel="noreferrer" className="btn btn-outline w-full">Open</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
