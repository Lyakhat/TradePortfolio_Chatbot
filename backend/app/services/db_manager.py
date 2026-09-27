import logging
from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
import pandas as pd
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Manages SQLite database connections, schema extraction, and query executions."""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.engine: Engine = create_engine(f"sqlite:///{db_path.as_posix()}", echo=False)

    def ingest_dataframe(self, table_name: str, df: pd.DataFrame, if_exists: str = "replace") -> int:
        """Writes a DataFrame to the SQLite database and returns the row count."""
        df.to_sql(table_name, self.engine, if_exists=if_exists, index=False)
        with self.engine.connect() as conn:
            result = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"')).fetchone()
            return result[0] if result else 0

    def get_tables(self) -> List[str]:
        """Returns the list of table names in the database."""
        inspector = inspect(self.engine)
        return inspector.get_table_names()

    def get_schema_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Extracts table names, column names, data types, row counts, and sample records.
        """
        inspector = inspect(self.engine)
        schema_info: Dict[str, Dict[str, Any]] = {}

        for table in inspector.get_table_names():
            columns = inspector.get_columns(table)
            col_names = [col['name'] for col in columns]
            col_types = {col['name']: str(col['type']) for col in columns}
            
            with self.engine.connect() as conn:
                count_res = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"')).fetchone()
                row_count = count_res[0] if count_res else 0
                
                # Fetch up to 3 sample rows
                sample_res = conn.execute(text(f'SELECT * FROM "{table}" LIMIT 3'))
                sample_rows = [dict(row._mapping) for row in sample_res.fetchall()]

            schema_info[table] = {
                'columns': col_names,
                'types': col_types,
                'row_count': row_count,
                'sample_rows': sample_rows
            }

        return schema_info

    def get_schema_prompt_text(self) -> str:
        """Formats the schema into human-readable text for LLM prompts."""
        schema_info = self.get_schema_info()
        schema_text = "DATABASE SCHEMA:\n" + "=" * 50 + "\n\n"
        for table, info in schema_info.items():
            schema_text += f"TABLE: {table} ({info['row_count']} rows)\n"
            schema_text += f"COLUMNS: {', '.join(info['columns'])}\n\n"
        return schema_text

    def auto_generate_sql_samples(self) -> List[Dict[str, str]]:
        """
        Dynamically generates initial seed question-SQL sample pairs based on the detected schema.
        """
        schema_info = self.get_schema_info()
        samples: List[Dict[str, str]] = []

        for table, info in schema_info.items():
            cols = info['columns']
            # Table total count
            samples.append({
                "question": f"How many total records in {table}?",
                "sql": f'SELECT COUNT(*) FROM "{table}"',
                "explanation": f"Counts total rows in {table}",
                "type": "auto_generated"
            })

            # Detect categorical columns (e.g., Name, Portfolio, Type, Status, Symbol, Ticker) - excluding technical IDs
            cat_cols = [c for c in cols if not c.lower().endswith('id') and not c.lower() == 'id' and any(k in c.lower() for k in ['name', 'type', 'status', 'portfolio', 'custodian', 'security', 'ticker', 'symbol', 'category'])]
            # Detect numeric / metric columns (e.g., price, qty, amount, pnl, value, mv, total, principal) - excluding technical IDs
            num_cols = [c for c in cols if not c.lower().endswith('id') and not c.lower() == 'id' and any(k in c.lower() for k in ['pl', 'pnl', 'price', 'qty', 'amount', 'mv', 'val', 'principal', 'total', 'cash', 'rate', 'cost'])]

            if cat_cols:
                primary_cat = cat_cols[0]
                samples.append({
                    "question": f"List unique {primary_cat} from {table}",
                    "sql": f'SELECT DISTINCT "{primary_cat}" FROM "{table}" ORDER BY "{primary_cat}"',
                    "explanation": f"Gets unique values for {primary_cat}",
                    "type": "auto_generated"
                })

            if cat_cols and num_cols:
                primary_cat = cat_cols[0]
                primary_num = num_cols[0]
                samples.append({
                    "question": f"Total {primary_num} grouped by {primary_cat} in {table}",
                    "sql": f'SELECT "{primary_cat}", SUM("{primary_num}") as total_{primary_num} FROM "{table}" GROUP BY "{primary_cat}" ORDER BY total_{primary_num} DESC',
                    "explanation": f"Aggregates {primary_num} grouped by {primary_cat}",
                    "type": "auto_generated"
                })

            if num_cols:
                primary_num = num_cols[0]
                samples.append({
                    "question": f"What is the average {primary_num} in {table}?",
                    "sql": f'SELECT AVG("{primary_num}") FROM "{table}"',
                    "explanation": f"Computes average {primary_num}",
                    "type": "auto_generated"
                })

        return samples

    def execute_sql(self, sql: str) -> Tuple[Optional[pd.DataFrame], Optional[str]]:
        """
        Executes a SQL query on the database engine.
        Returns (DataFrame, error_string).
        """
        try:
            df = pd.read_sql_query(sql, self.engine)
            return df, None
        except Exception as e:
            logger.error(f"SQL Execution Error: {e}")
            return None, str(e)
