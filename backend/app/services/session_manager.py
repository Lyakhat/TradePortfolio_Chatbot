import logging
import uuid
from typing import Dict, Optional
from pathlib import Path
import pandas as pd
from app.config import SESSIONS_DIR, DATA_DIR, PROJECT_ROOT
from app.services.db_manager import DatabaseManager
from app.services.rag_engine import RAGEngine
from app.services.data_cleaner import clean_columns, clean_dataframe, sanitize_table_name

logger = logging.getLogger(__name__)

class SessionContext:
    def __init__(self, session_id: str, db_path: Path):
        self.session_id = session_id
        self.db_path = db_path
        self.db_manager = DatabaseManager(db_path)
        self.rag_engine = RAGEngine()

    def initialize_rag(self):
        """Generates seed samples from the database schema and builds the vector index."""
        samples = self.db_manager.auto_generate_sql_samples()
        self.rag_engine.build_index_from_samples(samples)
        logger.info(f"Initialized RAG for session {self.session_id} with {len(samples)} seed samples.")


class SessionManager:
    """Manages active dataset sessions and isolated SQLite databases."""

    def __init__(self):
        self._sessions: Dict[str, SessionContext] = {}
        self._initialize_default_session()

    def _initialize_default_session(self):
        """Sets up the 'default' session using existing portfolio.db or holdings/trades CSVs if present."""
        default_db = DATA_DIR / "portfolio.db"
        default_ctx = SessionContext("default", default_db)
        
        # If database already exists and has tables, initialize RAG directly
        existing_tables = default_ctx.db_manager.get_tables() if default_db.exists() else []
        if existing_tables:
            default_ctx.initialize_rag()
        else:
            # Ingest initial CSVs from data/ folder
            holdings_csv = DATA_DIR / "holdings.csv"
            trades_csv = DATA_DIR / "trades.csv"

            if holdings_csv.exists() or trades_csv.exists():
                if holdings_csv.exists():
                    df_h = clean_dataframe(pd.read_csv(holdings_csv))
                    default_ctx.db_manager.ingest_dataframe("holdings", df_h)
                if trades_csv.exists():
                    df_t = clean_dataframe(pd.read_csv(trades_csv))
                    default_ctx.db_manager.ingest_dataframe("trades", df_t)
                default_ctx.initialize_rag()

        self._sessions["default"] = default_ctx

    def create_session(self, session_id: Optional[str] = None) -> SessionContext:
        """Creates a new isolated session and SQLite database."""
        sid = session_id or f"sess_{uuid.uuid4().hex[:8]}"
        db_path = SESSIONS_DIR / f"{sid}.db"
        ctx = SessionContext(sid, db_path)
        self._sessions[sid] = ctx
        return ctx

    def get_session(self, session_id: str = "default") -> Optional[SessionContext]:
        """Retrieves an existing session by ID."""
        if session_id in self._sessions:
            return self._sessions[session_id]
        
        # Check if SQLite DB file exists on disk
        db_path = SESSIONS_DIR / f"{session_id}.db"
        if db_path.exists():
            ctx = SessionContext(session_id, db_path)
            ctx.initialize_rag()
            self._sessions[session_id] = ctx
            return ctx

        return None

# Global singleton
session_manager = SessionManager()
