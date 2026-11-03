import re
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Generator
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import Transaction, Subscription, Alert, Recommendation, ChatMessage
from app.schemas.schemas import ChatQueryResponse, ChatProviderStatus
from app.services.financial_context_service import FinancialContextService
from app.ai.providers import (
    get_ai_provider,
    DeterministicFallbackProvider,
    OllamaProvider,
    CloudflareWorkersAIProvider,
)
from app.core.config import settings
from app.utils.helpers import format_inr

logger = logging.getLogger("finsentry.chatbot")

class ChatbotService:
    @staticmethod
    def get_provider_status(requested_model: Optional[str] = None) -> ChatProviderStatus:
        """
        Inspects active AI configuration and checks provider availability.
        """
        configured = settings.AI_PROVIDER.lower()
        active_provider = get_ai_provider(model_name=requested_model)
        
        status = "operational" if active_provider.is_available() else "degraded"
        return ChatProviderStatus(
            configured_provider=configured,
            active_provider=active_provider.provider_name,
            model=active_provider.model_name,
            status=status,
            is_available=active_provider.is_available(),
            fallback_available=True,
            available_models=settings.OLLAMA_AVAILABLE_MODELS,
        )

    @staticmethod
    def process_query(db: Session, query: str, model: Optional[str] = None) -> ChatQueryResponse:
        start_time = time.time()

        # 1. Save user query to chat history
        user_msg = ChatMessage(role="user", message=query)
        db.add(user_msg)
        db.commit()

        # 2. Fetch recent conversation history
        past_msgs = db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(6).all()
        history_list = [
            {"role": m.role, "message": m.message}
            for m in reversed(past_msgs[:-1])  # Exclude current user_msg
        ]

        # 3. Extract targeted financial context
        targeted_ctx = FinancialContextService.get_targeted_context(db, query)
        intent = targeted_ctx["intent"]
        prompt_context = targeted_ctx["prompt_context"]
        supporting_data = targeted_ctx["supporting_data"]
        suggested_followups = targeted_ctx["suggested_followups"]

        # 4. Attempt inference using configured AI provider
        provider = get_ai_provider(model_name=model)
        active_provider_name = provider.provider_name
        active_model_name = provider.model_name
        llm_response: Optional[str] = None
        is_grounded = True

        if not isinstance(provider, DeterministicFallbackProvider):
            try:
                llm_response, is_grounded = provider.generate(
                    user_query=query,
                    context_str=prompt_context,
                    history=history_list,
                )
            except Exception as e:
                logger.warning(f"AI Provider '{provider.provider_name}' failed: {e}. Falling back to deterministic engine.")
                fallback = DeterministicFallbackProvider()
                active_provider_name = f"{fallback.provider_name} (Fallback)"
                active_model_name = fallback.model_name
                llm_response, is_grounded = fallback.generate(query, prompt_context, history_list)
        else:
            llm_response, is_grounded = provider.generate(query, prompt_context, history_list)

        latency = round(time.time() - start_time, 2)

        # 5. Save assistant message to chat history
        asst_msg = ChatMessage(
            role="assistant",
            message=llm_response,
            intent=intent,
            metadata_json=json.dumps({
                "provider": active_provider_name,
                "model": active_model_name,
                "latency_seconds": latency,
            })
        )
        db.add(asst_msg)
        db.commit()

        return ChatQueryResponse(
            response=llm_response,
            intent=intent,
            supporting_data=supporting_data,
            suggested_followups=suggested_followups,
            provider=active_provider_name,
            model=active_model_name,
            grounded=is_grounded,
            latency_seconds=latency,
        )

    @staticmethod
    def stream_query(db: Session, query: str, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        Server-Sent Events generator streaming tokens in real time.
        Sends meta event, token events, and a final completion event.
        """
        start_time = time.time()
        first_token_time: Optional[float] = None

        # 1. Save user query to chat history
        user_msg = ChatMessage(role="user", message=query)
        db.add(user_msg)
        db.commit()

        # 2. Fetch recent conversation history
        past_msgs = db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(6).all()
        history_list = [
            {"role": m.role, "message": m.message}
            for m in reversed(past_msgs[:-1])
        ]

        # 3. Targeted context retrieval
        targeted_ctx = FinancialContextService.get_targeted_context(db, query)
        intent = targeted_ctx["intent"]
        prompt_context = targeted_ctx["prompt_context"]
        supporting_data = targeted_ctx["supporting_data"]
        suggested_followups = targeted_ctx["suggested_followups"]

        # 4. Resolve AI provider
        provider = get_ai_provider(model_name=model)
        active_provider_name = provider.provider_name
        active_model_name = provider.model_name

        # Yield metadata event first
        meta_event = {
            "type": "meta",
            "provider": active_provider_name,
            "model": active_model_name,
            "intent": intent,
            "supporting_data": supporting_data,
            "suggested_followups": suggested_followups,
        }
        yield f"event: meta\ndata: {json.dumps(meta_event)}\n\n"

        accumulated_text: List[str] = []
        token_count = 0

        try:
            stream_gen = provider.generate_stream(
                user_query=query,
                context_str=prompt_context,
                history=history_list,
            )
            for token in stream_gen:
                if first_token_time is None:
                    first_token_time = time.time()
                accumulated_text.append(token)
                token_count += 1
                token_payload = {"token": token}
                yield f"event: token\ndata: {json.dumps(token_payload)}\n\n"

        except Exception as e:
            logger.warning(f"Streaming failed on '{active_provider_name}': {e}. Switching to deterministic fallback.")
            fallback = DeterministicFallbackProvider()
            active_provider_name = f"{fallback.provider_name} (Fallback)"
            active_model_name = fallback.model_name
            for token in fallback.generate_stream(query, prompt_context, history_list):
                if first_token_time is None:
                    first_token_time = time.time()
                accumulated_text.append(token)
                token_count += 1
                yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"

        total_time = time.time() - start_time
        ttft = (first_token_time - start_time) if first_token_time else total_time
        speed = round(token_count / total_time, 1) if total_time > 0 else 0.0

        full_response = "".join(accumulated_text).strip()

        # Save assistant message to DB
        asst_msg = ChatMessage(
            role="assistant",
            message=full_response,
            intent=intent,
            metadata_json=json.dumps({
                "provider": active_provider_name,
                "model": active_model_name,
                "latency_seconds": round(total_time, 2),
                "ttft_seconds": round(ttft, 2),
                "tokens_per_second": speed,
            })
        )
        db.add(asst_msg)
        db.commit()

        done_event = {
            "type": "done",
            "done": True,
            "latency_seconds": round(total_time, 2),
            "ttft_seconds": round(ttft, 2),
            "tokens_per_second": speed,
            "provider": active_provider_name,
            "model": active_model_name,
        }
        yield f"event: done\ndata: {json.dumps(done_event)}\n\n"

    @staticmethod
    def get_history(db: Session, limit: int = 50) -> List[ChatMessage]:
        return db.query(ChatMessage).order_by(ChatMessage.created_at.asc()).limit(limit).all()

    @staticmethod
    def clear_history(db: Session) -> bool:
        db.query(ChatMessage).delete()
        db.commit()
        return True
