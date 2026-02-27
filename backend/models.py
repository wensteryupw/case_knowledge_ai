from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    id: int
    settlement_filename: str
    bid_filename: Optional[str] = None
    has_bid: bool
    analysis_status: str


class AnalyzeResponse(BaseModel):
    id: int
    analysis_status: str
    analysis_json: Optional[dict] = None
    analysis_error: Optional[str] = None
    cached: bool = False


class CaseDetail(BaseModel):
    id: int
    created_at: str
    settlement_filename: str
    bid_filename: Optional[str] = None
    has_bid: bool
    analysis_status: str
    analysis_json: Optional[dict] = None
    analysis_error: Optional[str] = None
    case_name: Optional[str] = None
    case_number: Optional[str] = None
    jurisdiction: Optional[str] = None
    settlement_type: Optional[str] = None


class CaseListItem(BaseModel):
    id: int
    created_at: str
    settlement_filename: str
    bid_filename: Optional[str] = None
    has_bid: bool
    analysis_status: str
    case_name: Optional[str] = None
    case_number: Optional[str] = None
    jurisdiction: Optional[str] = None
    settlement_type: Optional[str] = None


class DeleteResponse(BaseModel):
    deleted: bool


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
