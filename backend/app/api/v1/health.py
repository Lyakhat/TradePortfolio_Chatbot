from fastapi import APIRouter
from app.config import GROQ_API_KEY

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """Returns server and models health status."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "rag_engine_loaded": True,
        "groq_configured": bool(GROQ_API_KEY)
    }
