import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import api_router
from app.services.rag_engine import get_embedding_model
from app.services.session_manager import session_manager

from app.config import ALLOWED_ORIGINS
from app.middleware.rate_limiter import RateLimitMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("TradePortfolio_Server")

import threading

def _init_models_in_background():
    try:
        logger.info("Initializing embedding model in background...")
        get_embedding_model()
        _ = session_manager.get_session("default")
        logger.info("Background model & session initialization complete.")
    except Exception as e:
        logger.error(f"Error during background model initialization: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for FastAPI application - non-blocking port binding."""
    threading.Thread(target=_init_models_in_background, daemon=True).start()
    yield
    logger.info("Shutting down server...")

def create_app() -> FastAPI:
    """Factory function for FastAPI application."""
    app = FastAPI(
        title="Trade Portfolio & CSV Analytics Chatbot API",
        description="Dynamic RAG-powered Natural Language to SQL engine for custom CSV analytics with Groq Llama 3.3.",
        version="1.0.0",
        lifespan=lifespan
    )

    # CORS configuration allowing your Vercel frontend domain and localhost
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "Retry-After",
        ],
    )

    # Add In-Memory Rate Limiter Middleware
    app.add_middleware(RateLimitMiddleware)

    # Include API Routers
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/", tags=["Root"])
    def root():
        return {
            "message": "Trade Portfolio & CSV Analytics API is running",
            "docs": "/docs",
            "health": "/api/v1/health"
        }

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    from app.config import HOST, PORT
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
