import json
import uuid
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.pdf_parser import extract_text, chunk_text
from pathlib import Path
import io
import re
import requests
from bs4 import BeautifulSoup
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    _YT_AVAILABLE = True
except Exception:
    _YT_AVAILABLE = False
try:
    import pytesseract
    from PIL import Image
    _OCR_AVAILABLE = True
except Exception:
    _OCR_AVAILABLE = False
 
from app.embeddings import embed_texts
from app.vector_store import build_index, save_index, load_index, search
from app.db import (
    load_notes,
    save_notes,
    load_notebooks,
    save_notebooks,
    load_files_meta,
    save_files_meta,
)
from app.config import settings

app = FastAPI(
    title="StudyLM Backend (MVP)",
    docs_url=("/docs" if settings.ENABLE_API_DOCS else None),
    redoc_url=("/redoc" if settings.ENABLE_API_DOCS else None),
    openapi_url=("/openapi.json" if settings.ENABLE_API_DOCS else None),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=(settings.CORS_ORIGINS or ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ApiPrefixMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        path = request.scope.get("path", "")
        if path.startswith("/api/"):
            request.scope["path"] = path[4:]
            raw = request.scope.get("raw_path")
            if isinstance(raw, (bytes, bytearray)) and raw.startswith(b"/api/"):
                request.scope["raw_path"] = raw[4:]
        return await call_next(request)


app.add_middleware(ApiPrefixMiddleware)

@app.get("/models")
def list_models():
    """Return allowed chat models and defaults for the UI."""
    return {
        "chat": {
            "allowed": settings.CHAT_MODELS_ALLOWED,
            "default": settings.CHAT_MODEL,
        },
        "embedding": settings.EMBEDDING_MODEL,
    }

UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)
VECTORS_DIR = Path(settings.VECTOR_STORE_DIR)
VECTORS_DIR.mkdir(exist_ok=True)
REACT_DIST = Path("frontend-react") / "dist"

# Serve uploaded files at /uploads/<filename>
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
# Note: React/Vite frontend served separately. No static app mount here.

# If a production React build exists, serve its assets and index at /app
if REACT_DIST.exists():
    assets_dir = REACT_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/app", response_class=HTMLResponse)
    def app_index():
        return HTMLResponse((REACT_DIST / "index.html").read_text(encoding="utf-8"))

    # Serve favicon/logo placed by Vite public/ to dist root
    @app.get("/studylm.svg")
    def app_icon():
        icon_path = REACT_DIST / "studylm.svg"
        if icon_path.exists():
            return FileResponse(icon_path, media_type="image/svg+xml")
        raise HTTPException(status_code=404, detail="icon not found")

# Default system message for the chat model
system_msg = (
    "You are a helpful research assistant. Use only the provided context to answer. "
    "If the answer isn't in the context, say you don't know."
)

# Stage tracking helpers for better UX
def _stage_path(file_id: str) -> Path:
    return Path(VECTORS_DIR) / f"{file_id}.stage.txt"

def _write_stage(file_id: str, stage: str):
    try:
        _stage_path(file_id).write_text(stage, encoding="utf8")
    except Exception:
        pass

def _read_stage(file_id: str) -> str | None:
    p = _stage_path(file_id)
    return p.read_text(encoding="utf8").strip() if p.exists() else None


def _source_url(file_id: str, page_start: int | None = None) -> str | None:
    """Return a best-available URL to the uploaded source for this file_id.
    Prefers PDF if present (adds #page anchor), else PNG, JPG, then TXT.
    """
    pdf = UPLOADS_DIR / f"{file_id}.pdf"
    if pdf.exists():
        if page_start:
            return f"/uploads/{file_id}.pdf#page={page_start}"
        return f"/uploads/{file_id}.pdf"
    for ext in ("png", "jpg", "txt"):
        p = UPLOADS_DIR / f"{file_id}.{ext}"
        if p.exists():
            return f"/uploads/{file_id}.{ext}"
    return None


@app.get("/")
def root():
    """Landing route -> React app if built, otherwise safe info (docs hidden by default)."""
    if REACT_DIST.exists():
        return RedirectResponse(url="/app")
    if settings.ENABLE_API_DOCS:
        return RedirectResponse(url="/docs")
    return HTMLResponse("StudyLM API", status_code=200)


@app.get("/upload", response_class=HTMLResponse)
def upload_form():
    return (
        """
        <html>
            <body style="font-family: system-ui; padding: 2rem;">
                <h2>StudyLM — Upload a PDF</h2>
                <form method="post" action="/upload" enctype="multipart/form-data">
                    <input type="file" name="file" accept="application/pdf" required />
                    <button type="submit">Upload</button>
                </form>
                <p>Or open the <a href="/docs">interactive API docs</a>.</p>
            </body>
        </html>
        """
    )


@app.get("/uploads-list")
def list_uploads():
    # include common types we save
    patterns = ["*.pdf", "*.png", "*.jpg", "*.jpeg", "*.txt"]
    names = []
    for pat in patterns:
        names += [p.name for p in UPLOADS_DIR.glob(pat)]
    files = sorted(names)
    return {"files": files, "base_url": "/uploads/"}


@app.post("/upload")
async def upload(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDFs allowed")

    file_id = str(uuid.uuid4())
    temp_path = UPLOADS_DIR / f"{file_id}.pdf"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Process in background to keep API fast
    background_tasks.add_task(process_pdf, temp_path, file_id)

    return {"file_id": file_id, "message": "File queued for processing. It may take ~10-60s depending on size."}


def process_pdf(temp_path: Path, file_id: str):
    """Parse → chunk → embed → store."""
    print(f"Processing {file_id} …")
    try:
        _write_stage(file_id, "parsing")
        pages = extract_text(str(temp_path))  # [{page:int,text:str}]
    except Exception as e:
        # Record a marker file so status shows not-ready with reason
        (VECTORS_DIR / f"{file_id}.error.txt").write_text(str(e), encoding="utf8")
        _write_stage(file_id, "error")
        print(f"Failed to process {file_id}: {e}")
        return

    chunks = chunk_text(pages)  # [{text, page_start, page_end}]
    try:
        _write_stage(file_id, "embedding")
        embeddings = embed_texts([c["text"] for c in chunks])
        idx = build_index(embeddings)
        save_index(idx, file_id)
    except Exception as e:
        (VECTORS_DIR / f"{file_id}.error.txt").write_text(str(e), encoding="utf8")
        _write_stage(file_id, "error")
        print(f"Failed to build index for {file_id}: {e}")
        return

    # Keep chunk mapping (with page ranges) so we can cite context later
    mapping_file = Path(VECTORS_DIR) / f"{file_id}_chunks.json"
    mapping_file.write_text(json.dumps(chunks, indent=2), encoding="utf8")

    # Note: keep the uploaded PDF file for viewing; do not delete temp_path
    _write_stage(file_id, "done")
    print(f"Done {file_id}")


# --------------------------- Image OCR ingestion ---------------------------
@app.post("/upload_image")
async def upload_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if file.content_type not in {"image/png", "image/jpeg", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only PNG/JPEG images allowed")
    if not _OCR_AVAILABLE:
        raise HTTPException(status_code=500, detail="OCR not available (pytesseract/Pillow not installed)")
    file_id = str(uuid.uuid4())
    # preserve extension for serving/viewing
    ext = ".png" if file.content_type == "image/png" else ".jpg"
    temp_path = UPLOADS_DIR / f"{file_id}{ext}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    background_tasks.add_task(process_image, temp_path, file_id)
    return {"file_id": file_id, "message": "Image queued for OCR and processing."}


def process_image(temp_path: Path, file_id: str):
    try:
        img = Image.open(temp_path)
        lang = getattr(settings, "OCR_LANGUAGE", "eng") or "eng"
        cfg = getattr(settings, "OCR_TESSERACT_CONFIG", None)
        text = pytesseract.image_to_string(img, lang=lang, config=cfg)
        # Wrap as a single-page doc for downstream pipeline
        pages = [{"page": 1, "text": text.strip()}]
        chunks = chunk_text(pages)
        embeddings = embed_texts([c["text"] for c in chunks])
        idx = build_index(embeddings)
        save_index(idx, file_id)
        mapping_file = Path(VECTORS_DIR) / f"{file_id}_chunks.json"
        mapping_file.write_text(json.dumps(chunks, indent=2), encoding="utf8")
        _write_stage(file_id, "done")
    except Exception as e:
        (VECTORS_DIR / f"{file_id}.error.txt").write_text(str(e), encoding="utf8")
        _write_stage(file_id, "error")


# --------------------------- URL ingestion ---------------------------
class IngestUrl(BaseModel):
    url: str


def _is_youtube_url(u: str) -> bool:
    return any(x in u for x in ["youtube.com/watch", "youtube.com/shorts", "youtu.be/"])


def _extract_youtube_id(u: str) -> str | None:
    # Try patterns for youtu.be/<id> and youtube.com/watch?v=<id>
    m = re.search(r"youtu\.be/([A-Za-z0-9_-]{6,})", u)
    if m:
        return m.group(1)
    m = re.search(r"v=([A-Za-z0-9_-]{6,})", u)
    if m:
        return m.group(1)
    # shorts
    m = re.search(r"/shorts/([A-Za-z0-9_-]{6,})", u)
    if m:
        return m.group(1)
    return None


@app.post("/ingest_url")
def ingest_url(payload: IngestUrl):
    u = (payload.url or "").strip()
    if not (u.startswith("http://") or u.startswith("https://")):
        raise HTTPException(status_code=400, detail="Invalid URL")
    text = ""
    title = None
    if _is_youtube_url(u) and _YT_AVAILABLE:
        vid = _extract_youtube_id(u)
        if not vid:
            raise HTTPException(status_code=400, detail="Could not parse YouTube ID")
        try:
            transcript = YouTubeTranscriptApi.get_transcript(vid)
            text = "\n".join([seg.get("text") or "" for seg in transcript])
            title = f"YouTube:{vid}"
        except Exception:
            # Fallback to fetching HTML and parsing text if transcript not available
            pass
    if not text:
        try:
            resp = requests.get(u, timeout=20)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            # simple extraction: title + visible text
            t = soup.find("title")
            title = (t.get_text(strip=True) if t else None) or u
            # remove script/style
            for tag in soup(["script", "style", "noscript"]):
                tag.extract()
            text = soup.get_text("\n")
            text = re.sub(r"\n{2,}", "\n\n", (text or "").strip())
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {e}")

    if not text:
        raise HTTPException(status_code=400, detail="No text extracted from URL")

    file_id = str(uuid.uuid4())
    # Save a reference .txt file for viewing
    txt_path = UPLOADS_DIR / f"{file_id}.txt"
    txt_path.write_text(f"Source: {u}\n\n{title or ''}\n\n{text}", encoding="utf8")

    # Index
    pages = [{"page": 1, "text": text}]
    chunks = chunk_text(pages)
    embeddings = embed_texts([c["text"] for c in chunks])
    idx = build_index(embeddings)
    save_index(idx, file_id)
    mapping_file = Path(VECTORS_DIR) / f"{file_id}_chunks.json"
    mapping_file.write_text(json.dumps(chunks, indent=2), encoding="utf8")
    _write_stage(file_id, "done")
    return {"file_id": file_id, "message": "URL ingested and indexed"}


class AskRequest(BaseModel):
    file_id: str
    question: str
    chat_model: str | None = None


@app.post("/ask")
async def ask(payload: AskRequest):
    """Retrieve relevant chunks, ask GPT, and return answer."""
    # Load index & context
    try:
        idx = load_index(payload.file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Document not ready yet")

    mapping_file = Path(VECTORS_DIR) / f"{payload.file_id}_chunks.json"
    if not mapping_file.exists():
        raise HTTPException(status_code=500, detail="Missing chunks")

    chunks: list[dict] = json.loads(mapping_file.read_text())

    # Embedding of the user question
    q_vecs = embed_texts([payload.question])
    nearest, _ = search(idx, q_vecs[0])
    context_chunks = [chunks[i] for i in nearest]
    context_texts = [c["text"] for c in context_chunks]
    user_msg = (
        "Here is some context from the document:\n\n"
        + "\n\n".join(context_texts)
        + f"\n\nQ: {payload.question}\nA:"
    )
    full_prompt = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": user_msg},
    ]

    # Call LLM using OpenAI Python SDK v1
    from openai import OpenAI
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Server missing OPENAI_API_KEY")
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        resp = client.chat.completions.create(
            model=(payload.chat_model or settings.CHAT_MODEL),
            messages=full_prompt,
            temperature=0.2,
            max_tokens=512,
        )
        answer = resp.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    # Add simple citations pointing to PDF page(s)
    citations = []
    for c in context_chunks:
        page_start = c.get("page_start")
        page_end = c.get("page_end")
        url = _source_url(payload.file_id, page_start)
        citations.append(
            {
                "page_start": page_start,
                "page_end": page_end,
                "preview": (c.get("text") or "").strip()[:240],
                "url": url,
            }
        )

    return {"answer": answer, "citations": citations}


# --------------------------- Notebooks API ---------------------------
class NotebookCreate(BaseModel):
    title: str
    description: str | None = None


class NotebookPatch(BaseModel):
    title: str | None = None
    description: str | None = None


class NotebookSourceAttach(BaseModel):
    file_id: str


class NotebookFactCreate(BaseModel):
    text: str


def _now_ts() -> float:
    import time

    return time.time()


def _nb_get(nb_id: str) -> dict:
    data = load_notebooks()
    nb = data.get(nb_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return nb


@app.post("/notebooks")
def create_notebook(payload: NotebookCreate):
    data = load_notebooks()
    nb_id = str(uuid.uuid4())
    data[nb_id] = {
        "id": nb_id,
        "title": payload.title.strip() or "Untitled",
        "description": payload.description or "",
        "created_at": _now_ts(),
        "updated_at": _now_ts(),
        "sources": [],  # list of file_id
        "facts": [],  # list of {id,text,ts}
        "chat_history": [],  # list of {role,content,ts,citations?}
    }
    save_notebooks(data)
    return {"id": nb_id}


@app.get("/notebooks")
def list_notebooks():
    data = load_notebooks()
    out = []
    for nb in data.values():
        out.append(
            {
                "id": nb.get("id"),
                "title": nb.get("title"),
                "sources_count": len(nb.get("sources", [])),
                "updated_at": nb.get("updated_at"),
            }
        )
    return {"notebooks": sorted(out, key=lambda x: (x.get("updated_at") or 0), reverse=True)}


@app.get("/notebooks/{nb_id}")
def get_notebook(nb_id: str):
    nb = _nb_get(nb_id)
    return nb


@app.patch("/notebooks/{nb_id}")
def patch_notebook(nb_id: str, payload: NotebookPatch):
    data = load_notebooks()
    nb = data.get(nb_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    if payload.title is not None:
        nb["title"] = payload.title
    if payload.description is not None:
        nb["description"] = payload.description
    nb["updated_at"] = _now_ts()
    data[nb_id] = nb
    save_notebooks(data)
    return {"message": "Updated"}


@app.delete("/notebooks/{nb_id}")
def delete_notebook(nb_id: str):
    data = load_notebooks()
    if nb_id in data:
        data.pop(nb_id, None)
        save_notebooks(data)
    return {"message": "Deleted"}


@app.post("/notebooks/{nb_id}/sources")
def attach_source(nb_id: str, payload: NotebookSourceAttach):
    data = load_notebooks()
    nb = data.get(nb_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    fid = payload.file_id
    if fid not in nb.setdefault("sources", []):
        nb["sources"].append(fid)
    nb["updated_at"] = _now_ts()
    data[nb_id] = nb
    save_notebooks(data)
    return {"message": "Attached", "sources": nb["sources"]}


@app.delete("/notebooks/{nb_id}/sources/{file_id}")
def detach_source(nb_id: str, file_id: str):
    data = load_notebooks()
    nb = data.get(nb_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    nb["sources"] = [f for f in nb.get("sources", []) if f != file_id]
    nb["updated_at"] = _now_ts()
    data[nb_id] = nb
    save_notebooks(data)
    return {"message": "Detached", "sources": nb["sources"]}


@app.post("/notebooks/{nb_id}/facts")
def add_fact(nb_id: str, payload: NotebookFactCreate):
    data = load_notebooks()
    nb = data.get(nb_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    fact_id = str(uuid.uuid4())
    nb.setdefault("facts", []).append({"id": fact_id, "text": payload.text, "ts": _now_ts()})
    nb["updated_at"] = _now_ts()
    data[nb_id] = nb
    save_notebooks(data)
    return {"id": fact_id}


@app.delete("/notebooks/{nb_id}/facts/{fact_id}")
def remove_fact(nb_id: str, fact_id: str):
    data = load_notebooks()
    nb = data.get(nb_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    nb["facts"] = [f for f in nb.get("facts", []) if f.get("id") != fact_id]
    nb["updated_at"] = _now_ts()
    data[nb_id] = nb
    save_notebooks(data)
    return {"message": "Removed"}


class NotebookAsk(BaseModel):
    question: str
    chat_model: str | None = None
    temperature: float | None = 0.2
    max_tokens: int | None = 512
    include_sources: list[str] | None = None


@app.get("/notebooks/{nb_id}/history")
def notebook_history(nb_id: str):
    nb = _nb_get(nb_id)
    return {"history": nb.get("chat_history", [])}


@app.delete("/notebooks/{nb_id}/history")
def clear_notebook_history(nb_id: str):
    data = load_notebooks()
    nb = data.get(nb_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    nb["chat_history"] = []
    nb["updated_at"] = _now_ts()
    data[nb_id] = nb
    save_notebooks(data)
    return {"message": "Cleared"}


@app.post("/notebooks/{nb_id}/ask")
def ask_notebook(nb_id: str, payload: NotebookAsk):
    nb = _nb_get(nb_id)
    nb_settings = nb.get("settings", {})
    sources: list[str] = nb.get("sources", [])
    # Optional filtering by include_sources
    if payload.include_sources:
        allow = set(payload.include_sources)
        sources = [fid for fid in sources if fid in allow]
    if not sources:
        raise HTTPException(status_code=400, detail="Notebook has no sources")

    # Build combined retrieval: search each available source index and gather top results
    q_vecs = embed_texts([payload.question])
    qv = q_vecs[0]
    results = []  # list of (score, file_id, chunk_idx, chunk)
    for fid in sources:
        try:
            idx = load_index(fid)
        except FileNotFoundError:
            continue
        mapping_file = Path(VECTORS_DIR) / f"{fid}_chunks.json"
        if not mapping_file.exists():
            continue
        chunks: list[dict] = json.loads(mapping_file.read_text())
        nearest, scores = search(idx, qv)
        for i, sc in zip(nearest, scores):
            if i < 0 or i >= len(chunks):
                continue
            results.append((float(sc), fid, int(i), chunks[i]))

    if not results:
        raise HTTPException(status_code=404, detail="No indexed sources ready")

    # Take top-N across all sources
    results.sort(key=lambda r: r[0], reverse=True)
    top = results[:6]
    context_texts = [c[3].get("text") or "" for c in top]

    facts = nb.get("facts", [])
    facts_text = "\n".join(f"- {f.get('text')}" for f in facts) if facts else ""
    sys = system_msg
    if facts_text:
        sys = (
            system_msg
            + "\n\nAdditional notebook facts to consider (author-provided):\n"
            + facts_text
        )
    user_msg = (
        "Here is some context from the notebook sources (may include multiple files):\n\n"
        + "\n\n".join(context_texts)
        + f"\n\nQ: {payload.question}\nA:"
    )
    full_prompt = [
        {"role": "system", "content": sys},
        {"role": "user", "content": user_msg},
    ]

    from openai import OpenAI

    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Server missing OPENAI_API_KEY")
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        resp = client.chat.completions.create(
            model=(payload.chat_model or nb_settings.get("chat_model") or settings.CHAT_MODEL),
            messages=full_prompt,
            temperature=(payload.temperature if payload.temperature is not None else nb_settings.get("temperature", 0.2)),
            max_tokens=(payload.max_tokens or nb_settings.get("max_tokens") or 512),
        )
        answer = resp.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    citations = []
    for sc, fid, idx_i, chunk in top:
        page_start = chunk.get("page_start")
        page_end = chunk.get("page_end")
        url = _source_url(fid, page_start)
        citations.append(
            {
                "file_id": fid,
                "page_start": page_start,
                "page_end": page_end,
                "preview": (chunk.get("text") or "").strip()[:240],
                "url": url,
            }
        )

    # Persist chat history
    data = load_notebooks()
    nb = data.get(nb_id)
    if nb is not None:
        nb.setdefault("chat_history", []).append({"role": "user", "content": payload.question, "ts": _now_ts()})
        nb["chat_history"].append({"role": "assistant", "content": answer, "ts": _now_ts(), "citations": citations})
        nb["updated_at"] = _now_ts()
        data[nb_id] = nb
        save_notebooks(data)

    return {"answer": answer, "citations": citations}


# ---------------------- Notebook Study Tools API ----------------------
class SummarizeRequest(BaseModel):
    kind: str | None = "overview"  # overview | outline | glossary | key_points
    chat_model: str | None = None
    temperature: float | None = 0.2
    max_tokens: int | None = 800
    include_sources: list[str] | None = None


class FlashcardsRequest(BaseModel):
    count: int | None = 10
    chat_model: str | None = None
    temperature: float | None = 0.2
    max_tokens: int | None = 900
    include_sources: list[str] | None = None


class QuizRequest(BaseModel):
    count: int | None = 8
    chat_model: str | None = None
    temperature: float | None = 0.2
    max_tokens: int | None = 1200
    include_sources: list[str] | None = None


def _gather_notebook_context(nb: dict, query_hint: str, top_k: int = 8, include_sources: list[str] | None = None):
    """Retrieve top_k chunks across all notebook sources using a query hint."""
    sources: list[str] = nb.get("sources", [])
    if include_sources:
        allow = set(include_sources)
        sources = [fid for fid in sources if fid in allow]
    if not sources:
        raise HTTPException(status_code=400, detail="Notebook has no sources")
    # Embed the hint as the query vector
    q_vecs = embed_texts([query_hint])
    qv = q_vecs[0]
    results: list[tuple[float, str, int, dict]] = []
    for fid in sources:
        try:
            idx = load_index(fid)
        except FileNotFoundError:
            continue
        mapping_file = Path(VECTORS_DIR) / f"{fid}_chunks.json"
        if not mapping_file.exists():
            continue
        chunks: list[dict] = json.loads(mapping_file.read_text())
        nearest, scores = search(idx, qv)
        for i, sc in zip(nearest, scores):
            if i < 0 or i >= len(chunks):
                continue
            results.append((float(sc), fid, int(i), chunks[i]))
    if not results:
        raise HTTPException(status_code=404, detail="No indexed sources ready")
    results.sort(key=lambda r: r[0], reverse=True)
    top = results[:top_k]
    return top


def _openai_client():
    from openai import OpenAI

    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Server missing OPENAI_API_KEY")
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def _extract_json_maybe(text: str):
    """Best-effort extract JSON from model output that may include fences or preface."""
    import re

    s = text.strip()
    # Try direct parse first
    try:
        return json.loads(s)
    except Exception:
        pass
    # Look for fenced code blocks
    m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", s, re.IGNORECASE)
    if m:
        block = m.group(1)
        try:
            return json.loads(block)
        except Exception:
            pass
    # Fallback: find first [{ or { ... }]
    m = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", s)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    raise HTTPException(status_code=502, detail="Model did not return valid JSON")


@app.post("/notebooks/{nb_id}/summarize")
def summarize_notebook(nb_id: str, payload: SummarizeRequest):
    nb = _nb_get(nb_id)
    nb_settings = nb.get("settings", {})
    kind = (payload.kind or "overview").lower()
    if kind not in {"overview", "outline", "glossary", "key_points"}:
        raise HTTPException(status_code=400, detail="Invalid kind")

    hint_map = {
        "overview": "Provide a comprehensive summary of the notebook sources.",
        "outline": "Create a structured outline covering main sections and subtopics.",
        "glossary": "Create a glossary of key terms with concise definitions.",
        "key_points": "List the most important key points and takeaways.",
    }
    top = _gather_notebook_context(nb, hint_map[kind], top_k=10, include_sources=payload.include_sources)
    context_texts = [c[3].get("text") or "" for c in top]
    facts = nb.get("facts", [])
    facts_text = "\n".join(f"- {f.get('text')}" for f in facts) if facts else ""

    sys = system_msg
    if facts_text:
        sys += "\n\nAdditional notebook facts to consider (author-provided):\n" + facts_text
    user_msg = (
        f"Task: {hint_map[kind]}\n\n"
        "Use only the provided context from the notebook sources.\n\n"
        + "\n\n".join(context_texts)
        + "\n\nRespond in valid Markdown."
    )
    client = _openai_client()
    try:
        resp = client.chat.completions.create(
            model=(payload.chat_model or nb_settings.get("chat_model") or settings.CHAT_MODEL),
            messages=[{"role": "system", "content": sys}, {"role": "user", "content": user_msg}],
            temperature=(payload.temperature if payload.temperature is not None else nb_settings.get("temperature", 0.2)),
            max_tokens=(payload.max_tokens or nb_settings.get("max_tokens") or 800),
        )
        md = resp.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    data = load_notebooks()
    nb2 = data.get(nb_id) or nb
    study = nb2.setdefault("study", {})
    study[kind] = {"markdown": md, "ts": _now_ts()}
    nb2["updated_at"] = _now_ts()
    data[nb_id] = nb2
    save_notebooks(data)

    return {"kind": kind, "markdown": md}


@app.post("/notebooks/{nb_id}/flashcards")
def flashcards_notebook(nb_id: str, payload: FlashcardsRequest):
    nb = _nb_get(nb_id)
    nb_settings = nb.get("settings", {})
    top = _gather_notebook_context(nb, "Generate study flashcards from these sources.", top_k=12, include_sources=payload.include_sources)
    context_texts = [c[3].get("text") or "" for c in top]
    facts = nb.get("facts", [])
    facts_text = "\n".join(f"- {f.get('text')}" for f in facts) if facts else ""
    count = max(1, min(int(payload.count or 10), 40))

    sys = (
        "You create high-quality flashcards. Respond ONLY with a JSON array of objects with keys 'q' and 'a'."
    )
    if facts_text:
        sys += "\nConsider these notebook facts as additional guidance:\n" + facts_text
    user_msg = (
        f"Create {count} flashcards from the following context."
        " Keep questions concise and answers accurate."
        "\n\nContext:\n\n" + "\n\n".join(context_texts)
        + "\n\nReturn ONLY JSON."
    )
    client = _openai_client()
    try:
        resp = client.chat.completions.create(
            model=(payload.chat_model or nb_settings.get("chat_model") or settings.CHAT_MODEL),
            messages=[{"role": "system", "content": sys}, {"role": "user", "content": user_msg}],
            temperature=(payload.temperature if payload.temperature is not None else nb_settings.get("temperature", 0.2)),
            max_tokens=(payload.max_tokens or nb_settings.get("max_tokens") or 900),
        )
        raw = resp.choices[0].message.content
        cards = _extract_json_maybe(raw)
        if not isinstance(cards, list):
            raise ValueError("Expected a JSON array")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    data = load_notebooks()
    nb2 = data.get(nb_id) or nb
    study = nb2.setdefault("study", {})
    study["flashcards"] = {"items": cards, "ts": _now_ts()}
    nb2["updated_at"] = _now_ts()
    data[nb_id] = nb2
    save_notebooks(data)
    return {"count": len(cards), "items": cards}


@app.post("/notebooks/{nb_id}/quiz")
def quiz_notebook(nb_id: str, payload: QuizRequest):
    nb = _nb_get(nb_id)
    nb_settings = nb.get("settings", {})
    top = _gather_notebook_context(nb, "Generate a multiple-choice quiz from these sources.", top_k=12, include_sources=payload.include_sources)
    context_texts = [c[3].get("text") or "" for c in top]
    facts = nb.get("facts", [])
    facts_text = "\n".join(f"- {f.get('text')}" for f in facts) if facts else ""
    count = max(1, min(int(payload.count or 8), 30))

    sys = (
        "You create fair multiple-choice quizzes. Return ONLY JSON with an array of items,"
        " each item having: 'question' (str), 'options' (array of 4-5 strings), 'answer' (index of correct option)."
    )
    if facts_text:
        sys += "\nConsider these notebook facts as additional guidance:\n" + facts_text
    user_msg = (
        f"Create {count} MCQ items from the following context. Keep options unambiguous."
        "\n\nContext:\n\n" + "\n\n".join(context_texts)
        + "\n\nReturn ONLY JSON."
    )
    client = _openai_client()
    try:
        resp = client.chat.completions.create(
            model=(payload.chat_model or nb_settings.get("chat_model") or settings.CHAT_MODEL),
            messages=[{"role": "system", "content": sys}, {"role": "user", "content": user_msg}],
            temperature=(payload.temperature if payload.temperature is not None else nb_settings.get("temperature", 0.2)),
            max_tokens=(payload.max_tokens or nb_settings.get("max_tokens") or 1200),
        )
        raw = resp.choices[0].message.content
        quiz = _extract_json_maybe(raw)
        if not isinstance(quiz, list):
            raise ValueError("Expected a JSON array of quiz items")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")

    data = load_notebooks()
    nb2 = data.get(nb_id) or nb
    study = nb2.setdefault("study", {})
    study["quiz"] = {"items": quiz, "ts": _now_ts()}
    nb2["updated_at"] = _now_ts()
    data[nb_id] = nb2
    save_notebooks(data)
    return {"count": len(quiz), "items": quiz}


@app.get("/notebooks/{nb_id}/study")
def get_study(nb_id: str):
    nb = _nb_get(nb_id)
    return {"study": nb.get("study", {})}


class NotebookSettingsModel(BaseModel):
    chat_model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None


@app.get("/notebooks/{nb_id}/settings")
def get_notebook_settings(nb_id: str):
    nb = _nb_get(nb_id)
    return {"settings": nb.get("settings", {})}


@app.patch("/notebooks/{nb_id}/settings")
def patch_notebook_settings(nb_id: str, payload: NotebookSettingsModel):
    data = load_notebooks()
    nb = data.get(nb_id)
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    settings_nb = nb.setdefault("settings", {})
    if payload.chat_model is not None:
        settings_nb["chat_model"] = payload.chat_model
    if payload.temperature is not None:
        settings_nb["temperature"] = payload.temperature
    if payload.max_tokens is not None:
        settings_nb["max_tokens"] = int(payload.max_tokens)
    nb["updated_at"] = _now_ts()
    data[nb_id] = nb
    save_notebooks(data)
    return {"message": "Updated", "settings": settings_nb}


@app.get("/notebooks/{nb_id}/export.md")
def export_markdown(nb_id: str):
    nb = _nb_get(nb_id)
    title = nb.get("title") or "Untitled Notebook"
    facts = nb.get("facts", [])
    study = nb.get("study", {})
    sources = nb.get("sources", [])

    def sec(name: str, content_md: str | None):
        return f"\n\n## {name}\n\n{content_md.strip()}" if content_md else ""

    md = f"# {title}\n\nGenerated by StudyLM."
    if facts:
        md += "\n\n## Facts\n\n" + "\n".join(f"- {f.get('text')}" for f in facts)
    md += sec("Overview", (study.get("overview") or {}).get("markdown"))
    md += sec("Key Points", (study.get("key_points") or {}).get("markdown"))
    md += sec("Outline", (study.get("outline") or {}).get("markdown"))
    md += sec("Glossary", (study.get("glossary") or {}).get("markdown"))
    if study.get("flashcards"):
        items = study["flashcards"].get("items") or []
        md += "\n\n## Flashcards\n"
        for i, it in enumerate(items, 1):
            md += f"\n{i}. Q: {it.get('q')}\n   A: {it.get('a')}\n"
    if study.get("quiz"):
        items = study["quiz"].get("items") or []
        md += "\n\n## Quiz\n"
        for i, it in enumerate(items, 1):
            md += f"\n{i}. {it.get('question')}\n"
            opts = it.get("options") or []
            for j, opt in enumerate(opts):
                md += f"   - {chr(65+j)}. {opt}\n"
            ans = it.get("answer")
            if isinstance(ans, int) and 0 <= ans < len(opts):
                md += f"   Answer: {chr(65+ans)}\n"
    if sources:
        md += "\n\n## Sources\n\n"
        for fid in sources:
            md += f"- {fid}.pdf — /uploads/{fid}.pdf\n"

    return Response(content=md, media_type="text/markdown")


class SaveNoteRequest(BaseModel):
    file_id: str
    note: str


@app.post("/save_note")
async def save_note(payload: SaveNoteRequest):
    data = load_notes()
    data.setdefault(payload.file_id, []).append(payload.note)
    save_notes(data)
    return {"message": "Note saved"}


@app.get("/notes/{file_id}")
def get_notes(file_id: str):
    data = load_notes()
    return {"file_id": file_id, "notes": data.get(file_id, [])}


# ---------------------- Files metadata & listing ----------------------
class FileLabelPatch(BaseModel):
    label: str | None = None


@app.get("/files-meta")
def get_files_meta():
    return {"files": load_files_meta()}


@app.patch("/file/{file_id}/label")
def patch_file_label(file_id: str, payload: FileLabelPatch):
    data = load_files_meta()
    entry = data.setdefault(file_id, {})
    entry["label"] = (payload.label or "").strip()
    data[file_id] = entry
    save_files_meta(data)
    return {"message": "Updated", "file_id": file_id, "label": entry["label"]}


@app.get("/files")
def list_files():
    """List uploaded sources (pdf, images, text) with optional labels from files.json."""
    patterns = ["*.pdf", "*.png", "*.jpg", "*.jpeg", "*.txt"]
    names = []
    for pat in patterns:
        names += [p.name for p in UPLOADS_DIR.glob(pat)]
    files = sorted(names)
    meta = load_files_meta()
    out = []
    for name in files:
        # derive file_id from prefix before extension
        fid = name.split('.')[0]
        out.append({"file": name, "file_id": fid, "label": (meta.get(fid) or {}).get("label")})
    return {"files": out, "base_url": "/uploads/"}


# Health endpoint (for internal checks). Require a simple shared header to avoid public exposure.
@app.get("/health")
def health(x_internal: str | None = Header(default=None)):
    # If the special header is not present, return 404 to hide endpoint existence.
    # In Uvicorn/Starlette, headers map to parameters via Header(...) usually, but we keep it simple:
    # This endpoint is primarily consumed by internal health checks in Docker/K8s.
    # Require matching token when docs are disabled; allow open in dev
    if not settings.ENABLE_API_DOCS:
        token = settings.HEALTHCHECK_TOKEN or settings.OPENAI_API_KEY
        if not token or x_internal != token:
            raise HTTPException(status_code=404, detail="Not Found")
    return {"status": "OK"}


@app.get("/status/{file_id}")
def status(file_id: str):
    idx_path = Path(VECTORS_DIR) / f"{file_id}.faiss"
    chunks_path = Path(VECTORS_DIR) / f"{file_id}_chunks.json"
    error_path = Path(VECTORS_DIR) / f"{file_id}.error.txt"
    ready = idx_path.exists() and chunks_path.exists()
    return {
        "file_id": file_id,
        "ready": ready,
        "error": error_path.read_text(encoding="utf8") if error_path.exists() else None,
        "stage": _read_stage(file_id),
        "embedding_model": settings.EMBEDDING_MODEL,
        "chat_model": settings.CHAT_MODEL,
    }


@app.get("/file/{file_id}")
def get_file_info(file_id: str):
    pdf_path = UPLOADS_DIR / f"{file_id}.pdf"
    png_path = UPLOADS_DIR / f"{file_id}.png"
    jpg_path = UPLOADS_DIR / f"{file_id}.jpg"
    txt_path = UPLOADS_DIR / f"{file_id}.txt"
    idx_path = Path(VECTORS_DIR) / f"{file_id}.faiss"
    chunks_path = Path(VECTORS_DIR) / f"{file_id}_chunks.json"
    exists_pdf = pdf_path.exists()
    exists_png = png_path.exists()
    exists_jpg = jpg_path.exists()
    exists_txt = txt_path.exists()
    size_bytes = pdf_path.stat().st_size if exists_pdf else 0
    size_mb = round(size_bytes / (1024 * 1024), 2) if exists_pdf else 0
    pages = None
    if chunks_path.exists():
        try:
            chunks = json.loads(chunks_path.read_text(encoding="utf8"))
            mx = 0
            for c in chunks:
                ps = c.get("page_start") or 0
                pe = c.get("page_end") or ps
                mx = max(mx, ps, pe)
            pages = mx or None
        except Exception:
            pages = None
    return {
        "file_id": file_id,
        "exists_pdf": exists_pdf,
    "exists_png": exists_png,
    "exists_jpg": exists_jpg,
    "exists_txt": exists_txt,
        "size_bytes": size_bytes,
        "size_mb": size_mb,
        "pages": pages,
        "indexed": idx_path.exists() and chunks_path.exists(),
        "stage": _read_stage(file_id),
        "uploaded_at": (pdf_path.stat().st_mtime if exists_pdf else None),
    }


@app.delete("/file/{file_id}")
def delete_file(file_id: str):
    removed = []
    # remove any uploaded variant with this id
    for p in list(UPLOADS_DIR.glob(f"{file_id}.*")) + [
        Path(VECTORS_DIR) / f"{file_id}.faiss",
        Path(VECTORS_DIR) / f"{file_id}_chunks.json",
        Path(VECTORS_DIR) / f"{file_id}.error.txt",
        _stage_path(file_id),
    ]:
        try:
            if p.exists():
                p.unlink()
                removed.append(str(p))
        except Exception as e:
            print(f"Delete failed {p}: {e}")
    data = load_notes()
    if file_id in data:
        data.pop(file_id, None)
        save_notes(data)
    # also remove any files metadata labels
    try:
        meta = load_files_meta()
        if file_id in meta:
            meta.pop(file_id, None)
            save_files_meta(meta)
    except Exception:
        pass
    return {"message": "Deleted", "removed": removed}
