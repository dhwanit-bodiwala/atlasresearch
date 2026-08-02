import io
import re
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from read_write_action import write_memory

router = APIRouter()


# ── Chunking ─────────────────────────────────────────────────────

def chunk_markdown(text: str, min_chunk_size: int = 100) -> list:
    """
    Split markdown by H1/H2/H3 headers.
    Each section (header + its body) becomes one chunk.
    Sections shorter than min_chunk_size characters are skipped —
    they're usually just nav headers with no real content.
    """
    sections = re.split(r'\n(?=#{1,3} )', text)
    chunks = []
    for section in sections:
        section = section.strip()
        if len(section) >= min_chunk_size:
            chunks.append(section)
    return chunks


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """
    Split plain text into word-count chunks with a small overlap.
    chunk_size: words per chunk (500 ≈ ~2-3 paragraphs, fits comfortably
                in the embedding model's 256-token window after truncation)
    overlap: words carried over from the previous chunk so a fact that
             straddles a boundary doesn't get split in half.
    """
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = ' '.join(words[start:end])
        if chunk.strip():
            chunks.append(chunk.strip())
        if end >= len(words):
            break
        start = end - overlap
    return chunks


# ── PDF extraction ────────────────────────────────────────────────

def extract_pdf_text(file_bytes: bytes) -> str:
    """
    Extract plain text from PDF bytes using pypdf.
    Joins all pages with newlines.
    """
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            pages.append(page_text)
    return "\n".join(pages).strip()


# ── Endpoint ──────────────────────────────────────────────────────

@router.post("")
async def ingest(
    file: UploadFile = File(...),
    project_tag: str = Form(default="untagged"),
    source_name: str = Form(default=None),
):
    """
    Ingest a PDF, MD, or TXT file into the memories table as NOTE rows.

    - file:        the uploaded file
    - project_tag: tags all written chunks so they surface in research
                   runs on that project_tag
    - source_name: optional display name for the source; defaults to
                   the original filename if not provided

    Returns: { chunks_written, source, project_tag }
    """
    filename = file.filename or ""
    source = source_name or filename
    content = await file.read()

    # ── Extract text ──────────────────────────────────────────────
    if filename.endswith(".pdf"):
        try:
            text = extract_pdf_text(content)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF extraction failed: {str(e)}")
        chunks = chunk_text(text)

    elif filename.endswith(".md"):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File encoding not supported. Use UTF-8.")
        chunks = chunk_markdown(text)

    elif filename.endswith(".txt"):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="File encoding not supported. Use UTF-8.")
        chunks = chunk_text(text)

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Accepted: .pdf, .md, .txt"
        )

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

    if not chunks:
        raise HTTPException(status_code=400, detail="File produced no chunks after processing.")

    # ── Write each chunk to memories ──────────────────────────────
    ids = []
    for chunk in chunks:
        id = write_memory(
            content=chunk,
            type="NOTE",
            created_by="user",
            parent_id=None,
            source=source,
            project_tag=project_tag,
        )
        ids.append(id)

    return {
        "chunks_written": len(ids),
        "source": source,
        "project_tag": project_tag,
    }