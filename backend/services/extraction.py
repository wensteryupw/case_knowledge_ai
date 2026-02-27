"""PDF text extraction (PyMuPDF) and media type helpers."""

import fitz  # PyMuPDF


def get_media_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "pdf":
        return "application/pdf"
    if ext == "jpg":
        return "image/jpeg"
    return f"image/{ext}" if ext else "application/octet-stream"


def extract_text(file_path: str, media_type: str) -> str:
    """Extract text from a PDF using PyMuPDF. Returns empty string for images."""
    if media_type != "application/pdf":
        return ""
    try:
        doc = fitz.open(file_path)
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    except Exception:
        return ""
