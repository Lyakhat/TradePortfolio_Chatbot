import logging
import os
from typing import List, Dict, Any, Optional
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from langchain_core.documents import Document
from app.config import EMBEDDING_MODEL_NAME

# Silence noisy tokenizers and hub logs
os.environ["TOKENIZERS_PARALLELISM"] = "false"
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("transformers").setLevel(logging.ERROR)

logger = logging.getLogger(__name__)

# Global singleton for SentenceTransformer
_SHARED_EMBEDDING_MODEL: Optional[SentenceTransformer] = None

def get_embedding_model() -> SentenceTransformer:
    global _SHARED_EMBEDDING_MODEL
    if _SHARED_EMBEDDING_MODEL is None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME}")
        _SHARED_EMBEDDING_MODEL = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _SHARED_EMBEDDING_MODEL


class RAGEngine:
    """Manages FAISS vector indexing, similarity search, and dynamic self-learning memory."""

    def __init__(self):
        self.embedding_model = get_embedding_model()
        self.documents: List[Document] = []
        self.embeddings_list: List[np.ndarray] = []
        self.index: Optional[faiss.IndexFlatL2] = None
        self.dimension: int = 384

    def build_index_from_samples(self, samples: List[Dict[str, str]]):
        """Builds or resets the FAISS vector index from seed samples."""
        self.documents = []
        self.embeddings_list = []

        for sample in samples:
            content = f"Question: {sample['question']}\nSQL: {sample['sql']}\nExplanation: {sample.get('explanation', '')}"
            doc = Document(
                page_content=content,
                metadata={
                    "type": sample.get("type", "sql_sample"),
                    "question": sample["question"],
                    "sql": sample["sql"]
                }
            )
            self.documents.append(doc)
            emb = self.embedding_model.encode(content, show_progress_bar=False)
            self.embeddings_list.append(emb)

        if self.embeddings_list:
            embeddings_array = np.array(self.embeddings_list).astype('float32')
            self.dimension = embeddings_array.shape[1]
            self.index = faiss.IndexFlatL2(self.dimension)
            self.index.add(embeddings_array)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)

    def retrieve_relevant_examples(self, question: str, top_k: int = 2) -> List[Document]:
        """Retrieves the top-k most semantically similar question-SQL pairs."""
        if not self.documents or self.index is None or self.index.ntotal == 0:
            return []

        actual_k = min(top_k, len(self.documents))
        question_emb = self.embedding_model.encode(question, show_progress_bar=False).astype('float32').reshape(1, -1)
        distances, indices = self.index.search(question_emb, actual_k)
        
        results = []
        for idx in indices[0]:
            if 0 <= idx < len(self.documents):
                results.append(self.documents[idx])
        return results

    def add_success_to_rag(self, question: str, sql: str):
        """Dynamically stores a newly validated successful query into RAG vector memory."""
        content = f"Q: {question}\nSQL: {sql}"
        doc = Document(
            page_content=content,
            metadata={"type": "learned_sample", "question": question, "sql": sql}
        )
        new_emb = self.embedding_model.encode(content, show_progress_bar=False).astype('float32')
        self.documents.append(doc)
        self.embeddings_list.append(new_emb)

        embeddings_array = np.array(self.embeddings_list).astype('float32')
        new_index = faiss.IndexFlatL2(self.dimension)
        new_index.add(embeddings_array)
        self.index = new_index
        logger.info(f"RAG dynamically updated. Total samples: {len(self.documents)}")

    def get_all_samples(self) -> List[Dict[str, Any]]:
        """Returns all currently indexed samples."""
        samples = []
        for doc in self.documents:
            samples.append({
                "question": doc.metadata.get("question", ""),
                "sql": doc.metadata.get("sql", ""),
                "type": doc.metadata.get("type", "sample"),
                "content": doc.page_content
            })
        return samples
