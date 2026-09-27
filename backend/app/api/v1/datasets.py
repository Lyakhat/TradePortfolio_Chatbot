from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.schemas.dataset import (
    DatasetUploadResponse,
    TableInfo,
    DatasetSchemaResponse,
    TableSchemaDetail,
    DatasetSamplesResponse,
    SampleQueryItem,
)
from app.services.session_manager import session_manager
from app.services.data_cleaner import parse_and_clean_csv, sanitize_table_name

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/upload", response_model=DatasetUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_csv_files(
    files: List[UploadFile] = File(..., description="One or more CSV files to upload"),
    session_id: Optional[str] = Form(None, description="Optional existing session ID to update")
):
    """
    Upload one or multiple CSV files to create or update an isolated database session.
    Automatically cleans column names, ingests tables, and creates FAISS RAG index.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    ctx = session_manager.create_session(session_id)
    table_infos: List[TableInfo] = []

    for file in files:
        if not file.filename.lower().endswith(".csv"):
            continue
        
        try:
            content = await file.read()
            df = parse_and_clean_csv(content, file.filename)
            table_name = sanitize_table_name(file.filename)
            row_count = ctx.db_manager.ingest_dataframe(table_name, df, if_exists="replace")
            
            table_infos.append(TableInfo(
                table_name=table_name,
                row_count=row_count,
                columns=list(df.columns)
            ))
        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to process file '{file.filename}': {str(e)}"
            )

    if not table_infos:
        raise HTTPException(status_code=400, detail="No valid CSV files were processed.")

    # Re-build RAG index with the new database tables
    ctx.initialize_rag()
    sample_count = len(ctx.rag_engine.documents)

    return DatasetUploadResponse(
        session_id=ctx.session_id,
        message=f"Successfully ingested {len(table_infos)} tables into session database.",
        tables=table_infos,
        rag_sample_count=sample_count
    )

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
