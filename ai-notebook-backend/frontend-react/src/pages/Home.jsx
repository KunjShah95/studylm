import React, { useEffect, useState } from 'react'

export default function Home({ base = '', navigate = () => {} }) {
  const [models, setModels] = useState(null)
  const [filesCount, setFilesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      setErr('')
      setLoading(true)
      try {
        const [mRes, fRes] = await Promise.all([
          fetch(`${base}/models`).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
          fetch(`${base}/files`).then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
        ])
        if (!alive) return
        setModels(mRes)
        setFilesCount((mRes && fRes && (fRes.files || []).length) || 0)
      } catch (e) {
        if (alive) setErr('Unable to load status')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [base])

  return (
    <div className="container-custom py-6">
      <section className="card p-6" style={{ background: 'linear-gradient(180deg, rgba(240,249,255,0.5), rgba(255,255,255,0.3))' }}>
        <div className="flex items-center gap-3 mb-2">
          <img src="/studylm.svg" alt="StudyLM" width={36} height={36} />
          <h1 className="text-2xl font-extrabold">StudyLM</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-1 mb-4 text-sm">
          Turn PDFs into answers, notes, and study aids. Upload a file, ask questions, and build notebooks.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('upload')} className="btn btn-primary">Upload a PDF</button>
          <button onClick={() => navigate('chat')} className="btn btn-secondary">Ask a Question</button>
          <button onClick={() => navigate('files')} className="btn btn-secondary">Browse Files</button>
          <button onClick={() => navigate('notes')} className="btn btn-secondary">Open Notes</button>
        </div>
      </section>

      <section className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <Card onClick={() => navigate('upload')} title="Upload" subtitle="Add a PDF and let us index it for Q&A" />
        <Card onClick={() => navigate('chat')} title="Chat" subtitle="Ask questions grounded in your documents" />
        <Card onClick={() => navigate('files')} title="Files" subtitle="View PDFs and open them quickly" />
        <Card onClick={() => navigate('notes')} title="Notes" subtitle="Capture insights and save learnings" />
      </section>

      <section className="mt-4">
        <div className="card p-4">
          <h3 className="m-0 mb-2 font-semibold">System status</h3>
          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : err ? (
            <p className="text-error-600">{err}</p>
          ) : (
            <div className="flex gap-4 flex-wrap">
              <Stat label="Files" value={String(filesCount)} />
              <Stat label="Chat model" value={(models && models.chat && models.chat.default) || '—'} />
              <Stat label="Embedding" value={(models && models.embedding) || '—'} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Card({ title, subtitle, onClick }) {
  return (
    <button onClick={onClick} className="card card-hover text-left p-4">
      <h3 className="m-0 mb-1 font-semibold">{title}</h3>
      <p className="m-0 text-gray-600 dark:text-gray-400 text-sm">{subtitle}</p>
    </button>
  )}

function Stat({ label, value }) {
  return (
    <div className="card p-3" style={{ minWidth: 160 }}>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  )
}
