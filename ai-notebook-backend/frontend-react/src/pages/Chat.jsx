import React, { useEffect, useMemo, useState } from 'react'

export default function Chat({ base = '' }) {
  const [files, setFiles] = useState([])
  const [fileId, setFileId] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([]) // {q,a,citations,ts}

  // Load available files for selection
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`${base}/files`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (alive) {
          setFiles(data.files || [])
          if (!fileId && (data.files || []).length) setFileId(data.files[0].file_id)
        }
      } catch {
        // ignore
      }
    })()
    return () => { alive = false }
  }, [base])

  // Persist history per file in localStorage
  const storageKey = useMemo(() => (fileId ? `studylm_chat_${fileId}` : ''), [fileId])
  useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setHistory(JSON.parse(raw))
      else setHistory([])
    } catch { setHistory([]) }
  }, [storageKey])
  useEffect(() => {
    if (!storageKey) return
    try { localStorage.setItem(storageKey, JSON.stringify(history)) } catch {}
  }, [history, storageKey])

  const ask = async () => {
    setLoading(true)
    setAnswer('')
    setCitations([])
    setError('')
    try {
      const res = await fetch(`${base}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId, question })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setAnswer(data.answer || '')
      setCitations(Array.isArray(data.citations) ? data.citations : [])
      setHistory(prev => [{ q: question, a: data.answer || '', citations: (Array.isArray(data.citations) ? data.citations : []), ts: Date.now() }, ...prev].slice(0, 20))
      setQuestion('')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(answer)
    } catch {}
  }

  const downloadMarkdown = () => {
    const md = formatMarkdown()
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chat-answer.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const systemShare = async () => {
    const md = formatMarkdown()
    if (navigator.share) {
      try {
        await navigator.share({ title: 'StudyLM Answer', text: md })
      } catch {}
    } else {
      downloadMarkdown()
    }
  }

  const formatMarkdown = () => {
    let md = `# Answer\n\n${answer}\n`
    if (citations && citations.length) {
      md += `\n\n## Citations\n`
      citations.forEach((c, i) => {
        const label = c.url ? `[page ${c.page_start ?? ''}](${c.url})` : `page ${c.page_start ?? ''}`
        md += `\n${i + 1}. ${label} — ${c.preview || ''}`
      })
    }
    return md
  }

  const copyCitationLink = async (url) => {
    try {
      const full = url.startsWith('http') ? url : `${window.location.origin}${url}`
      await navigator.clipboard.writeText(full)
    } catch {}
  }

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !loading && fileId && question.trim()) {
      ask()
    }
  }

  return (
    <div className="container-custom py-8 max-w-2xl mx-auto">
      <div className="card card-hover p-6 mb-8">
        <h2 className="text-xl font-bold mb-2">Ask a question</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Query your uploaded PDFs using AI. Choose a file and type your question.</p>
        <div className="flex flex-col gap-3">
          <select className="input" value={fileId} onChange={e => setFileId(e.target.value)}>
            <option value="">Select a file…</option>
            {files.map(f => (
              <option key={f.file_id} value={f.file_id}>{f.label || f.file}</option>
            ))}
          </select>
          <textarea
            className="input"
            placeholder="Type your question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
          />
          <button
            className="btn btn-primary mt-2"
            onClick={ask}
            disabled={!fileId || !question || loading}
          >
            {loading ? 'Asking…' : 'Ask'}
          </button>
        </div>
        {error && <div className="mt-3 text-error-600 text-sm">{error}</div>}
      </div>
      <div className="card p-6 min-h-[80px]">
        {answer ? (
          <div className="space-y-4">
            <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{answer}</div>
            {citations && citations.length > 0 && (
              <div className="pt-2 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Citations</div>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                  {citations.map((c, i) => (
                    <li key={i} className="truncate">
                      <span className="mr-2">{i + 1}.</span>
                      {c.url ? (
                        <a className="text-sky-600 dark:text-sky-400" href={c.url} target="_blank" rel="noreferrer">
                          Page {c.page_start ?? ''}
                        </a>
                      ) : (
                        <span>Page {c.page_start ?? ''}</span>
                      )}
                      {c.preview && <span className="ml-2 opacity-75">— {c.preview}</span>}
                      {c.url && (
                        <button className="btn btn-ghost ml-2" onClick={() => copyCitationLink(c.url)}>Copy link</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button className="btn btn-outline" onClick={copyAnswer}>Copy</button>
              <button className="btn btn-outline" onClick={downloadMarkdown}>Download .md</button>
              <button className="btn btn-secondary" onClick={systemShare}>Share…</button>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-sm">No answer yet. Ask a question above to get started.</div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card p-6 mt-6">
          <div className="flex items-center mb-3">
            <h3 className="text-lg font-semibold">Recent Q&A</h3>
            <button className="btn btn-ghost ml-auto" onClick={() => setHistory([])}>Clear</button>
          </div>
          <ul className="space-y-3">
            {history.map((h, idx) => (
              <li key={idx} className="border rounded-lg p-3" style={{ borderColor: 'hsl(var(--border))' }}>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{new Date(h.ts).toLocaleString()}</div>
                <div className="text-sm"><strong>Q:</strong> {h.q}</div>
                <div className="text-sm mt-1 whitespace-pre-wrap"><strong>A:</strong> {h.a}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
