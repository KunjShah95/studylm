# StudyLM — Production Guide

This document explains the production-ready setup for StudyLM: architecture, environment, deployment, and ops.

## Architecture

```mermaid
flowchart LR
  subgraph Client
    B[Browser SPA]
  end

  subgraph Infra
    N[Nginx (frontend)]
    A[FastAPI Backend]
    U[(uploads/)]
    V[(vector_store/)]
  end

  B <--> N
  N -->|/api/*| A
  N -->|/uploads/*| A
  A --> U
  A --> V
```

- Nginx serves the built React SPA and proxies API calls under `/api` to the backend.
- Backend handles uploads, parsing (PyMuPDF), embedding (OpenAI), retrieval (FAISS), and chat/notes/notebooks endpoints.
- Data is stored locally in `uploads/` and `vector_store/` volumes.

## Environment Variables

Copy `.env.example` to `.env` and set your values:

Required:
- OPENAI_API_KEY: Your OpenAI API key.

Recommended:
- CORS_ALLOW_ORIGINS: e.g., `https://your-domain.com`
- ENABLE_API_DOCS=0 in production
- HEALTHCHECK_TOKEN: random secret used by container healthchecks

Tuning (optional): MAX_CHUNK_TOKENS, VECTOR_STORE_DIR, MAX_PDF_MB, MAX_PDF_PAGES, EMBEDDING_MODEL, CHAT_MODEL.

## Build and Deploy (Docker)

Prereqs: Docker and Docker Compose.

1) Place `.env` in `ai-notebook-backend/` (same folder as `docker-compose.yml`).
2) Build images:

```bash
docker compose build
```

3) Start services:

```bash
docker compose up -d
```

4) Open the app at `http://<server>:8080/`.

Notes:
- Frontend Nginx listens on port 8080 by default. Change in `docker-compose.yml` if needed.
- Frontend proxies `/api/*` and `/uploads/*` to the backend.
- Restart policy is `unless-stopped` for resilience.

## Security & Hardening

- Set `CORS_ALLOW_ORIGINS` to your domain only.
- Keep `ENABLE_API_DOCS=0` to hide docs in production.
- Use a strong `HEALTHCHECK_TOKEN`.
- Terminate TLS with a reverse proxy or load balancer in front of Nginx, or run Nginx with TLS.
- Ensure only 8080 (or your chosen port) is exposed; backend is internal.

## Operations

Health:
- Frontend container has a simple HTTP health at `/health`.
- Backend healthcheck requires header `x-internal: <HEALTHCHECK_TOKEN>` and is used internally.

Logs:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Rebuild/Update:
```bash
git pull
docker compose build
docker compose up -d
```

Backups:
- Persist `uploads/` and `vector_store/` (mounted as volumes) as needed.

## Troubleshooting

- 502 on /api calls: ensure backend container is healthy; check `OPENAI_API_KEY`.
- Upload fails with large PDFs: Nginx `client_max_body_size` is 50m, adjust if required.
- CORS errors: set `CORS_ALLOW_ORIGINS` to your site origin.

## Endpoints (Highlights)

- POST /api/upload → queue PDF for processing
- GET /api/status/{file_id} → processing state
- GET /api/files → list PDFs
- POST /api/ask → Q&A with citations
- Notes: POST /api/save_note, GET /api/notes/{file_id}
- Notebooks suite: create/list/attach sources, ask across sources, study tools (summarize/flashcards/quiz)

## Frontend Build Notes

- Vite generates hashed assets under `frontend-react/dist`. The Nginx image copies them to `/usr/share/nginx/html`.
- History API fallback is configured; deep links load correctly.
- Static assets under `/assets/*` are cacheable for 1 year (immutable).
