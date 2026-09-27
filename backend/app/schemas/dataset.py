from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class TableInfo(BaseModel):
    table_name: str
    row_count: int
    columns: List[str]

class DatasetUploadResponse(BaseModel):
    session_id: str
    message: str
    tables: List[TableInfo]
    rag_sample_count: int

class TableSchemaDetail(BaseModel):
    columns: List[str]
    types: Dict[str, str]
    row_count: int
    sample_rows: List[Dict[str, Any]]

class DatasetSchemaResponse(BaseModel):
    session_id: str
    tables: Dict[str, TableSchemaDetail]

class SampleQueryItem(BaseModel):
    question: str
    sql: str
    explanation: Optional[str] = None
    type: str = "auto_generated"

class DatasetSamplesResponse(BaseModel):
    session_id: str
    total_samples: int
    samples: List[SampleQueryItem]
