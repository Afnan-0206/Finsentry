from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas.schemas import ChatQueryRequest, ChatQueryResponse, ChatHistoryItem, ChatProviderStatus
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/chat", tags=["AI Financial Investigator"])

@router.get("/status", response_model=ChatProviderStatus)
def get_ai_status(model: Optional[str] = Query(None)):
    """Returns the currently active AI provider and model status."""
    return ChatbotService.get_provider_status(requested_model=model)

@router.post("", response_model=ChatQueryResponse)
def query_investigator(payload: ChatQueryRequest, db: Session = Depends(get_db)):
    """Processes user queries against the SQLite ledger synchronously."""
    return ChatbotService.process_query(db, payload.message, model=payload.model)

@router.post("/stream")
def stream_investigator(payload: ChatQueryRequest, db: Session = Depends(get_db)):
    """
    Streams the financial investigation in real time using Server-Sent Events (SSE).
    Provides progressive token generation, Time-to-First-Token metrics, and structured evidence.
    """
    generator = ChatbotService.stream_query(db, payload.message, model=payload.model)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

@router.get("/history", response_model=List[ChatHistoryItem])
def get_chat_history(db: Session = Depends(get_db)):
    """Retrieves conversation history with FinSentry Investigator."""
    history = ChatbotService.get_history(db)
    return [ChatHistoryItem.from_orm(m) for m in history]

@router.delete("/history")
def clear_chat_history(db: Session = Depends(get_db)):
    """Clears conversation history."""
    ChatbotService.clear_history(db)
    return {"status": "cleared", "message": "Conversation history cleared successfully."}
