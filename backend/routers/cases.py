"""API endpoints for case management: upload, analyze, get, list, delete, chat."""

import json
import os
import uuid

import anthropic
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse

from backend.config import UPLOAD_DIR, ANTHROPIC_API_KEY, CLAUDE_MODEL
from backend.database import get_db
from backend.models import (
    UploadResponse,
    AnalyzeResponse,
    CaseDetail,
    CaseListItem,
    DeleteResponse,
    ChatRequest,
)
from backend.services.extraction import get_media_type, extract_text
from backend.services.analysis import run_analysis
from backend.prompts import build_chat_system_prompt

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.post("/upload", response_model=UploadResponse)
async def upload_case(
    files: list[UploadFile] = File(...),
    db=Depends(get_db),
):
    """Upload case files. First file = settlement, second = bid (if any)."""
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")

    settlement = files[0]
    bid = files[1] if len(files) > 1 else None

    # Save settlement file
    settlement_ext = settlement.filename.rsplit(".", 1)[-1] if "." in settlement.filename else "pdf"
    settlement_stored = f"{uuid.uuid4().hex}.{settlement_ext}"
    settlement_path = str(UPLOAD_DIR / settlement_stored)
    content = await settlement.read()
    with open(settlement_path, "wb") as f:
        f.write(content)

    settlement_media = get_media_type(settlement.filename)
    settlement_text = extract_text(settlement_path, settlement_media)

    # Save bid file if provided
    has_bid = bid is not None
    bid_filename = None
    bid_path = None
    bid_media = None
    bid_text = None

    if has_bid:
        bid_ext = bid.filename.rsplit(".", 1)[-1] if "." in bid.filename else "pdf"
        bid_stored = f"{uuid.uuid4().hex}.{bid_ext}"
        bid_path = str(UPLOAD_DIR / bid_stored)
        bid_content = await bid.read()
        with open(bid_path, "wb") as f:
            f.write(bid_content)
        bid_filename = bid.filename
        bid_media = get_media_type(bid.filename)
        bid_text = extract_text(bid_path, bid_media)

    cursor = db.execute(
        """INSERT INTO cases
            (settlement_filename, settlement_path, settlement_media_type,
             bid_filename, bid_path, bid_media_type, has_bid,
             settlement_text, bid_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            settlement.filename,
            settlement_path,
            settlement_media,
            bid_filename,
            bid_path,
            bid_media,
            int(has_bid),
            settlement_text,
            bid_text,
        ),
    )
    db.commit()
    case_id = cursor.lastrowid

    return UploadResponse(
        id=case_id,
        settlement_filename=settlement.filename,
        bid_filename=bid_filename,
        has_bid=has_bid,
        analysis_status="pending",
    )


@router.post("/{case_id}/analyze", response_model=AnalyzeResponse)
def analyze_case(case_id: int, db=Depends(get_db)):
    """Run AI analysis on a case. Returns cached result if already completed."""
    row = db.execute("SELECT id FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")

    result = run_analysis(db, case_id)

    if result["analysis_status"] == "failed":
        raise HTTPException(status_code=500, detail=result["analysis_error"])

    return AnalyzeResponse(**result)


@router.get("/{case_id}", response_model=CaseDetail)
def get_case(case_id: int, db=Depends(get_db)):
    """Get full case details including analysis."""
    row = db.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")

    analysis_json = None
    if row["analysis_json"]:
        analysis_json = json.loads(row["analysis_json"])

    return CaseDetail(
        id=row["id"],
        created_at=row["created_at"],
        settlement_filename=row["settlement_filename"],
        bid_filename=row["bid_filename"],
        has_bid=bool(row["has_bid"]),
        analysis_status=row["analysis_status"],
        analysis_json=analysis_json,
        analysis_error=row["analysis_error"],
        case_name=row["case_name"],
        case_number=row["case_number"],
        jurisdiction=row["jurisdiction"],
        settlement_type=row["settlement_type"],
    )


@router.get("", response_model=list[CaseListItem])
def list_cases(db=Depends(get_db)):
    """List all cases (lightweight, no analysis_json)."""
    rows = db.execute(
        """SELECT id, created_at, settlement_filename, bid_filename, has_bid,
                  analysis_status, case_name, case_number, jurisdiction, settlement_type
           FROM cases ORDER BY created_at DESC"""
    ).fetchall()

    return [
        CaseListItem(
            id=r["id"],
            created_at=r["created_at"],
            settlement_filename=r["settlement_filename"],
            bid_filename=r["bid_filename"],
            has_bid=bool(r["has_bid"]),
            analysis_status=r["analysis_status"],
            case_name=r["case_name"],
            case_number=r["case_number"],
            jurisdiction=r["jurisdiction"],
            settlement_type=r["settlement_type"],
        )
        for r in rows
    ]


@router.get("/{case_id}/pdf/{doc_type}")
def serve_pdf(case_id: int, doc_type: str, db=Depends(get_db)):
    """Serve a case's uploaded PDF file for in-browser viewing."""
    if doc_type not in ("settlement", "bid"):
        raise HTTPException(status_code=400, detail="doc_type must be 'settlement' or 'bid'")

    row = db.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")

    file_path = row[f"{doc_type}_path"]
    media_type = row[f"{doc_type}_media_type"]

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"No {doc_type} file found")

    return FileResponse(
        file_path,
        media_type=media_type,
        headers={"Content-Disposition": "inline"},
    )


@router.post("/{case_id}/chat")
def chat_case(case_id: int, body: ChatRequest, db=Depends(get_db)):
    """Stream a chat response grounded in the case's analysis and document text."""
    row = db.execute(
        "SELECT analysis_json, settlement_text, bid_text FROM cases WHERE id = ?",
        (case_id,),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")
    if not row["analysis_json"]:
        raise HTTPException(status_code=400, detail="Case has no analysis yet")

    analysis_json = json.loads(row["analysis_json"])
    system_prompt = build_chat_system_prompt(
        analysis_json, row["settlement_text"], row["bid_text"]
    )

    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    def generate():
        with client.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=system_prompt,
            messages=messages,
        ) as stream:
            for text in stream.text_stream:
                payload = json.dumps({"type": "delta", "text": text})
                yield f"data: {payload}\n\n"
        yield f"data: {json.dumps({'type': 'stop'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.delete("/{case_id}", response_model=DeleteResponse)
def delete_case(case_id: int, db=Depends(get_db)):
    """Delete a case and its uploaded files."""
    row = db.execute(
        "SELECT settlement_path, bid_path FROM cases WHERE id = ?", (case_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Case not found")

    # Remove files from disk
    for path in [row["settlement_path"], row["bid_path"]]:
        if path and os.path.exists(path):
            os.remove(path)

    db.execute("DELETE FROM cases WHERE id = ?", (case_id,))
    db.commit()

    return DeleteResponse(deleted=True)
