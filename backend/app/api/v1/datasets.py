from fastapi import APIRouter, HTTPException
from app.schemas.dataset import (
    DatasetSchemaResponse,
    TableSchemaDetail,
    DatasetSamplesResponse,
    SampleQueryItem,
)
from app.services.session_manager import session_manager

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("/{session_id}/schema", response_model=DatasetSchemaResponse)
def get_dataset_schema(session_id: str):
    """Retrieves schema, columns, types, row counts, and sample rows for a session."""
    ctx = session_manager.get_session(session_id)
    if not ctx:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    schema_info = ctx.db_manager.get_schema_info()
    table_details = {}

    for table, info in schema_info.items():
        table_details[table] = TableSchemaDetail(
            columns=info['columns'],
            types=info['types'],
            row_count=info['row_count'],
            sample_rows=info['sample_rows']
        )

    return DatasetSchemaResponse(
        session_id=session_id,
        tables=table_details
    )

@router.get("/{session_id}/samples", response_model=DatasetSamplesResponse)
def get_dataset_samples(session_id: str):
    """Lists all seed and learned SQL query examples for a session."""
    ctx = session_manager.get_session(session_id)
    if not ctx:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    all_samples = ctx.rag_engine.get_all_samples()
    sample_items = [
        SampleQueryItem(
            question=s["question"],
            sql=s["sql"],
            type=s["type"]
        ) for s in all_samples
    ]

    return DatasetSamplesResponse(
        session_id=session_id,
        total_samples=len(sample_items),
        samples=sample_items
    )
