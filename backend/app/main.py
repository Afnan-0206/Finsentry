import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
import app.models.models  # Ensure all models are registered
from app.models.models import Transaction
from app.services.demo_data_service import DemoDataService

# Import routers
from app.api.routes import (
    dashboard,
    transactions,
    subscriptions,
    anomalies,
    duplicates,
    forecasting,
    recommendations,
    chat,
    alerts,
    budgets,
    ai,
    system,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed if database is completely empty
    db = SessionLocal()
    try:
        count = db.query(Transaction).count()
        if count == 0:
            print("[FinSentry AI] Initializing database with demonstration dataset...")
            DemoDataService.reset_and_seed_demo_data(db)
            print("[FinSentry AI] Demonstration data populated successfully.")
    except Exception as e:
        print(f"[FinSentry AI] Error during startup seeding: {e}")
    finally:
        db.close()

    yield

    # Shutdown
    pass

app = FastAPI(
    title="FinSentry AI API",
    description="AI-Powered Financial Intelligence, Subscription Leakage Detection & Early-Warning System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(transactions.router, prefix=settings.API_V1_PREFIX)
app.include_router(subscriptions.router, prefix=settings.API_V1_PREFIX)
app.include_router(anomalies.router, prefix=settings.API_V1_PREFIX)
app.include_router(duplicates.router, prefix=settings.API_V1_PREFIX)
app.include_router(forecasting.router, prefix=settings.API_V1_PREFIX)
app.include_router(recommendations.router, prefix=settings.API_V1_PREFIX)
app.include_router(chat.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)
app.include_router(budgets.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(system.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "app": "FinSentry AI",
        "tagline": "Your money. Your patterns. Your protection.",
        "status": "online",
        "docs": "/docs",
        "health": "OK"
    }
