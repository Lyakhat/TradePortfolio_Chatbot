import re
import logging
from typing import Optional, List
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from app.config import GROQ_API_KEY, GROQ_MODEL

logger = logging.getLogger(__name__)

FALLBACK_MESSAGE = "Sorry can not find the answer"

class SQLGenerator:
    """Generates precise, clean SQL queries using Groq LLMs and RAG schema context."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or GROQ_API_KEY
        self.model_name = model or GROQ_MODEL
        self._llm = None

    @property
    def llm(self) -> ChatGroq:
        if self._llm is None:
            if not self.api_key:
                raise ValueError("GROQ_API_KEY is not configured. Please set it in your .env file.")
            self._llm = ChatGroq(
                groq_api_key=self.api_key,
                model=self.model_name,
                temperature=0.0,
                max_tokens=500
            )
        return self._llm

    def generate_sql(
        self,
        question: str,
        schema_text: str,
        relevant_docs: List[Document],
        temperature: float = 0.0
    ) -> str:
        """
        Generates a SQL query from user natural language, guided by retrieved examples and schema.
        """
        examples_str = "\n\n".join([doc.page_content for doc in relevant_docs]) if relevant_docs else "None provided."

        prompt = f"""You are an expert SQL engineer for financial portfolio analytics.

SCHEMA:
{schema_text}

EXAMPLES:
{examples_str}

RULES:
1. Return ONLY pure SQL without markdown code blocks, backticks, or explanations.
2. Select human-readable descriptive columns (e.g. Name, SecName, ShortName, PortfolioName, SecurityTypeName, CustodianName, TradeTypeName) and financial metrics (e.g. PL_YTD, MV_Base, Quantity, Price, Principal).
3. Always prefer full descriptive names (e.g. "Name" in trades, "PortfolioName", "CustodianName") over abbreviations or shortcut codes.
4. When writing SELECT queries, alias cryptic columns with clear human-readable names where appropriate (e.g. `SecName AS [Security Name]`, `PL_YTD AS [P&L YTD]`, `MV_Base AS [Market Value]`, `Qty AS [Quantity]`).
5. Do NOT select internal technical database IDs (such as SecurityId, RevisionId, AllocationId, id) unless the user explicitly asks for IDs.
6. If not database-related or cannot be answered from the schema, return exactly: {FALLBACK_MESSAGE}

QUESTION: {question}"""

        candidate_models = [self.model_name, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "allam-2-7b"]
        last_exception = None

        for model_candidate in candidate_models:
            try:
                chat_client = ChatGroq(
                    groq_api_key=self.api_key,
                    model=model_candidate,
                    temperature=temperature,
                    max_tokens=500
                )
                response = chat_client.invoke(prompt)
                raw_text = response.content.strip()
                # Clean markdown code blocks if the model generated them
                cleaned_sql = re.sub(r'```(?:sql)?\s*(.*?)\s*```', r'\1', raw_text, flags=re.DOTALL).strip()
                cleaned_sql = cleaned_sql.rstrip(';').strip()
                return cleaned_sql
            except Exception as e:
                last_exception = e
                err_str = str(e)
                if "model_not_found" in err_str or "404" in err_str or "does not exist" in err_str:
                    logger.warning(f"Model '{model_candidate}' unavailable on Groq, trying next candidate...")
                    continue
                else:
                    logger.error(f"LLM invocation error with '{model_candidate}': {e}")
                    raise e

        if last_exception:
            raise last_exception
        return FALLBACK_MESSAGE
