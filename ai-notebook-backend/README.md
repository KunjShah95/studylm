# StudyLM (MVP)

StudyLM is a lightweight NotebookLM-style RAG app. Upload PDFs, organize sources into notebooks, ask questions with citations, add guiding facts, and generate study aids.

## Features

- FastAPI backend with PDF parsing (PyMuPDF), OpenAI embeddings (text-embedding-3-small), FAISS retrieval, and GPT responses.
- Local persistence for uploads, vector store, and notes.json.
- React (Vite) frontend in `frontend-react/` for the UI (upload, status, chat with citations, notes, notebooks, study tools). If built, backend serves it at `/app`.
- Optional Streamlit UI in `streamlit_app/`.

### Features
- Upload PDFs and ask questions with citations
- Upload images (PNG/JPG) — OCR extracts text and indexes it
- Ingest links (web pages or YouTube). We fetch readable text or transcripts and index them
## Requirements

- Python 3.11+
- An OpenAI API key

## Quickstart

Backend (FastAPI):

1) Create a virtual environment and install deps.
2) Create a `.env` file with your API key (see below).
3) Run the server and open API docs at <http://127.0.0.1:8000/docs>

Frontend (React dev server):

1) From `frontend-react/`, install deps and start the dev server.
2) Open the app in your browser (default: <http://localhost:5173>). The dev server proxies API calls to <http://127.0.0.1:8000>.

Production (serve React build via FastAPI):

1) From `frontend-react/`, build the app: `npm ci || npm install` then `npm run build`.
2) Restart the backend. If `frontend-react/dist/` exists, the backend will serve it at `/app` and redirect `/` to `/app`.

Docker (one container: backend + built React):

```bash
docker build -t studylm .
docker run --rm -p 8000:8000 --env-file .env studylm
```

Then open <http://127.0.0.1:8000/> (redirects to `/app`).

Smoke test (Windows PowerShell):

```powershell
./smoke.ps1 -BaseUrl http://127.0.0.1:8000
```

Client handoff checklist:

- Provide `.env` (or `.env.example`) with OPENAI_API_KEY.
- Confirm uploads/ and vector_store/ are writable (they’re gitignored).
- Use React dev server in development or the built assets route `/app` in production.

Production deployment guide: see `PRODUCTION.md` for hardened Nginx config, env, and ops.

### .env

```env
OPENAI_API_KEY=sk-...
# Optional tuning
# MAX_CHUNK_TOKENS=750
# VECTOR_STORE_DIR=vector_store
# MAX_PDF_MB=20
# MAX_PDF_PAGES=200
# EMBEDDING_MODEL=text-embedding-3-small
# CHAT_MODEL=gpt-4o-mini
```

## Endpoints

- POST /upload: Upload a PDF; background processes and indexes it.
- GET /status/{file_id}: Check if the index is ready (and any error).
- GET /file/{file_id}: File metadata (size, pages), index status.
- DELETE /file/{file_id}: Delete the PDF and its index.
- POST /ask: Ask a question about a single document.
- POST /save_note: Append a note for a file.
- GET /notes/{file_id}: List notes for a file.
- GET /uploads-list: List uploaded PDFs and base URL.
- Files metadata:
	- GET /files-meta, PATCH /file/{file_id}/label
	- GET /files (list PDFs with optional labels)
- Notebooks:
	- POST /notebooks, GET /notebooks, GET/PATCH/DELETE /notebooks/{id}
	- POST /notebooks/{id}/sources attach, DELETE /notebooks/{id}/sources/{file_id}
	- POST /notebooks/{id}/facts add, DELETE /notebooks/{id}/facts/{fact_id}
	- GET /notebooks/{id}/history, DELETE /notebooks/{id}/history, POST /notebooks/{id}/ask (multi-source)
	- GET /notebooks/{id}/settings, PATCH /notebooks/{id}/settings
	- Study tools: POST /notebooks/{id}/summarize (overview|outline|glossary|key_points), POST /notebooks/{id}/flashcards, POST /notebooks/{id}/quiz, GET /notebooks/{id}/study, GET /notebooks/{id}/export.md

## Dev notes

- We lazy-check OPENAI_API_KEY at call-time to keep the app bootable for docs/UI.
- Vector indices and chunk mappings are stored in `vector_store/`.
- Uploaded PDFs are available at `/uploads/{file_id}.pdf`.

## Roadmap

- Export to PDF; shareable links
- Auth & cloud storage
- Per-notebook retrieval filters (by selected sources)
