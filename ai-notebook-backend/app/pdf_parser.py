import fitz
import tiktoken
from .config import settings
from typing import Optional

# Optional OCR deps (available when Tesseract is installed)
try:
    import pytesseract  # type: ignore
    from PIL import Image  # type: ignore
    _OCR_AVAILABLE = True
except Exception:
    _OCR_AVAILABLE = False

encoder = tiktoken.get_encoding("cl100k_base")

def extract_text(pdf_path: str) -> list[dict]:
    """Return a list of pages with their text; enforces size/page limits.

    Output shape: [{"page": 1, "text": "..."}, ...]
    """
    # Guard: approximate size in MB
    try:
        import os
        size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
        if size_mb > settings.MAX_PDF_MB:
            raise ValueError(f"PDF too large ({size_mb:.1f}MB). Limit is {settings.MAX_PDF_MB}MB.")
    except OSError:
        pass

    doc = fitz.open(pdf_path)
    if doc.page_count > settings.MAX_PDF_PAGES:
        raise ValueError(
            f"PDF has {doc.page_count} pages; limit is {settings.MAX_PDF_PAGES}."
        )
    pages = []
    for i, page in enumerate(doc, start=1):
        txt = page.get_text() or ""
        # If page seems to contain no text and OCR is enabled/available, try OCR as fallback
        if settings.OCR_ENABLED and _looks_like_no_text(txt):
            ocr_txt = _ocr_page_text(page)
            if ocr_txt:
                txt = ocr_txt
        pages.append({"page": i, "text": txt})
    return pages


def _looks_like_no_text(text: str) -> bool:
    """Heuristic: decide when to attempt OCR fallback.
    Consider 'no text' if stripped length is very small or whitespace-heavy.
    """
    s = (text or "").strip()
    if not s:
        return True
    # Very low character count indicates likely scanned page
    return len(s) < 30


def _ocr_page_text(page: "fitz.Page") -> Optional[str]:
    if not _OCR_AVAILABLE:
        return None
    try:
        # Render to image at configured DPI
        dpi = max(72, int(getattr(settings, "OCR_DPI", 200)))
        scale = dpi / 72.0
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        import io

        png_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(png_bytes))
        # Allow custom Tesseract lang via settings
        lang = getattr(settings, "OCR_LANGUAGE", "eng") or "eng"
        cfg = getattr(settings, "OCR_TESSERACT_CONFIG", None)
        text = pytesseract.image_to_string(img, lang=lang, config=cfg)
        return (text or "").strip()
    except Exception:
        return None

def _split_by_tokens(text: str, max_tokens: int) -> list[str]:
    toks = encoder.encode(text)
    out = []
    for i in range(0, len(toks), max_tokens):
        out.append(encoder.decode(toks[i:i + max_tokens]))
    return out

def chunk_text(pages: list[dict]) -> list[dict]:
    """Chunk page texts into token-bounded chunks with page ranges.

    Input: list of {page:int, text:str}
    Output: list of {text:str, page_start:int, page_end:int}
    """
    chunks: list[dict] = []
    current = ""
    page_start = None
    page_end = None

    for p in pages:
        page_no = p["page"]
        # Split by double-newlines as rough paragraph boundaries
        paragraphs = [x for x in p["text"].split("\n\n") if x.strip()]
        if not paragraphs:
            paragraphs = [p["text"]]

        for para in paragraphs:
            para_tokens = len(encoder.encode(para))
            current_tokens = len(encoder.encode(current)) if current else 0
            if para_tokens > settings.MAX_CHUNK_TOKENS:
                # Hard split oversized paragraph
                parts = _split_by_tokens(para, settings.MAX_CHUNK_TOKENS)
                for i, part in enumerate(parts):
                    if current:
                        # flush current first
                        chunks.append({
                            "text": current.strip(),
                            "page_start": page_start,
                            "page_end": page_end,
                        })
                        current = ""
                        page_start = None
                        page_end = None
                    chunks.append({
                        "text": part.strip(),
                        "page_start": page_no,
                        "page_end": page_no,
                    })
                continue

            if current_tokens + para_tokens > settings.MAX_CHUNK_TOKENS:
                # flush current
                if current:
                    chunks.append({
                        "text": current.strip(),
                        "page_start": page_start,
                        "page_end": page_end,
                    })
                current = para
                page_start = page_no
                page_end = page_no
            else:
                # append to current
                if not current:
                    current = para
                    page_start = page_no
                    page_end = page_no
                else:
                    current = (current + "\n\n" + para).strip()
                    page_end = max(page_end or page_no, page_no)

    if current:
        chunks.append({
            "text": current.strip(),
            "page_start": page_start,
            "page_end": page_end,
        })

    return chunks