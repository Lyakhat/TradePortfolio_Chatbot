import time
from fastapi import APIRouter, HTTPException, status
from app.schemas.chat import (
    ChatQueryRequest,
    ChatQueryResponse,
    RawSqlRequest,
    RawSqlResponse,
)
from app.services.session_manager import session_manager
from app.services.sql_generator import SQLGenerator, FALLBACK_MESSAGE
from app.services.sql_guard import is_safe_sql, enforce_limit
from app.utils.formatting import format_query_result

router = APIRouter(prefix="/chat", tags=["Chat & Query"])
sql_generator = SQLGenerator()

@router.post("/query", response_model=ChatQueryResponse)
def query_dataset(request: ChatQueryRequest):
    """
    Asks a natural language question against the uploaded dataset.
    Uses RAG retrieval, Groq dynamic SQL generation, safety guardrails, and self-learning.
    """
    start_time = time.time()
    session_id = request.session_id or "default"
    ctx = session_manager.get_session(session_id)
    if not ctx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found. Please upload CSV files first."
        )

    # 1. Retrieve RAG examples
    relevant_docs = ctx.rag_engine.retrieve_relevant_examples(
        question=request.question,
        top_k=request.top_k_examples
    )

    # 2. Get Schema representation
    schema_text = ctx.db_manager.get_schema_prompt_text()

    # 3. Generate SQL from LLM
    try:
        raw_sql = sql_generator.generate_sql(
            question=request.question,
            schema_text=schema_text,
            relevant_docs=relevant_docs,
            temperature=request.temperature
        )
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        return ChatQueryResponse(
            session_id=session_id,
            question=request.question,
            sql_generated=None,
            execution_status="error",
            formatted_answer=f"Error generating SQL: {str(e)}",
            learned_to_rag=False,
            execution_time_ms=round(elapsed, 2),
            error_message=str(e)
        )

    # 4. Check for Fallback / Non-database questions
    if FALLBACK_MESSAGE in raw_sql or not raw_sql:
        elapsed = (time.time() - start_time) * 1000
        return ChatQueryResponse(
            session_id=session_id,
            question=request.question,
            sql_generated=None,
            execution_status="fallback",
            formatted_answer=FALLBACK_MESSAGE,
            learned_to_rag=False,
            execution_time_ms=round(elapsed, 2)
        )

    # 5. Security Guardrails
    is_safe, reason = is_safe_sql(raw_sql)
    if not is_safe:
        elapsed = (time.time() - start_time) * 1000
        return ChatQueryResponse(
            session_id=session_id,
            question=request.question,
            sql_generated=raw_sql,
            execution_status="security_violation",
            formatted_answer=f"⚠️ {reason}",
            learned_to_rag=False,
            execution_time_ms=round(elapsed, 2),
            error_message=reason
        )

    # 6. Auto-LIMIT injection
    safe_sql = enforce_limit(raw_sql, limit=100)

    # 7. Execute SQL
    df, error = ctx.db_manager.execute_sql(safe_sql)
    elapsed = (time.time() - start_time) * 1000

    if error:
        return ChatQueryResponse(
            session_id=session_id,
            question=request.question,
            sql_generated=safe_sql,
            execution_status="error",
            formatted_answer=f"Query error: {error}",
            learned_to_rag=False,
            execution_time_ms=round(elapsed, 2),
            error_message=error
        )

    if df is None or df.empty:
        return ChatQueryResponse(
            session_id=session_id,
            question=request.question,
            sql_generated=safe_sql,
            execution_status="fallback",
            formatted_answer=FALLBACK_MESSAGE,
            learned_to_rag=False,
            execution_time_ms=round(elapsed, 2)
        )

    # 8. Self-Learning RAG Update on success
    ctx.rag_engine.add_success_to_rag(request.question, safe_sql)

    # 9. Format response
    formatted_answer = format_query_result(df)
    data_records = df.head(100).to_dict(orient="records")

    return ChatQueryResponse(
        session_id=session_id,
        question=request.question,
        sql_generated=safe_sql,
        execution_status="success",
        row_count=len(df),
        columns=list(df.columns),
        data=data_records,
        formatted_answer=formatted_answer,
        learned_to_rag=True,
        execution_time_ms=round(elapsed, 2)
    )

@router.post("/execute-raw-sql", response_model=RawSqlResponse)
def execute_raw_sql(request: RawSqlRequest):
    """Executes a direct raw SQL query against the session database with security guardrails."""
    session_id = request.session_id or "default"
    ctx = session_manager.get_session(session_id)
    if not ctx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found."
        )

    is_safe, reason = is_safe_sql(request.sql)
    if not is_safe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    safe_sql = enforce_limit(request.sql, limit=100)
    df, error = ctx.db_manager.execute_sql(safe_sql)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"SQL Error: {error}")

    data_records = df.head(100).to_dict(orient="records") if df is not None else []
    cols = list(df.columns) if df is not None else []

    return RawSqlResponse(
        session_id=session_id,
        sql=safe_sql,
        row_count=len(df) if df is not None else 0,
        columns=cols,
        data=data_records
    )
