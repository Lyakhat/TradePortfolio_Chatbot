from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ChatQueryRequest(BaseModel):
    session_id: Optional[str] = Field(default="default", description="Active dataset session ID")
    question: str = Field(..., min_length=1, description="Natural language question to query the database")
    temperature: float = Field(default=0.0, ge=0.0, le=1.0, description="Sampling temperature for LLM")
    top_k_examples: int = Field(default=2, ge=1, le=10, description="Number of RAG few-shot examples to retrieve")

class ChatQueryResponse(BaseModel):
    session_id: str
    question: str
    sql_generated: Optional[str] = None
    execution_status: str  # 'success', 'fallback', 'error', 'security_violation'
    row_count: int = 0
    columns: List[str] = []
    data: List[Dict[str, Any]] = []
    formatted_answer: str
    learned_to_rag: bool = False
    execution_time_ms: Optional[float] = None
    error_message: Optional[str] = None

class RawSqlRequest(BaseModel):
    session_id: Optional[str] = Field(default="default", description="Active dataset session ID")
    sql: str = Field(..., min_length=1, description="Raw SQL query string")

class RawSqlResponse(BaseModel):
    session_id: str
    sql: str
    row_count: int
    columns: List[str]
    data: List[Dict[str, Any]]
