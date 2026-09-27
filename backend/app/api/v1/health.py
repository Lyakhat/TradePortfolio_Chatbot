from fastapi import APIRouter
from app.config import GROQ_API_KEY
from app.services.rag_engine import _SHARED_EMBEDDING_MODEL

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """Returns server and models health status."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "embedding_model_loaded": _SHARED_EMBEDDING_MODEL is not None,
        "groq_configured": bool(GROQ_API_KEY)
    }
