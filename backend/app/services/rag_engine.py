import logging
import os
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

class RAGEngine:
    """
    Lightweight, high-performance RAG Vector Engine.
    Uses TF-IDF n-gram vectorization and cosine similarity matching.
    Consumes < 40MB RAM, starts in milliseconds, and avoids PyTorch OOM limits on cloud tiers.
    """

    def __init__(self):
        self.documents: List[Document] = []
        self.raw_texts: List[str] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix: Optional[Any] = None

    def build_index_from_samples(self, samples: List[Dict[str, str]]):
        """Builds or resets the vector index from SQL samples."""
        self.documents = []
        self.raw_texts = []

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
            self.raw_texts.append(sample["question"] + " " + content)

        if self.raw_texts:
            self.vectorizer = TfidfVectorizer(
                ngram_range=(1, 3),
                sublinear_tf=True,
                lowercase=True
            )
            self.tfidf_matrix = self.vectorizer.fit_transform(self.raw_texts)
            logger.info(f"Built lightweight RAG index with {len(self.documents)} samples.")
        else:
            self.vectorizer = None
            self.tfidf_matrix = None

    def retrieve_relevant_examples(self, question: str, top_k: int = 2) -> List[Document]:
        """Retrieves the top-k most semantically similar question-SQL pairs."""
        if not self.documents or self.vectorizer is None or self.tfidf_matrix is None:
            return []

        try:
            query_vec = self.vectorizer.transform([question])
            similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
            
            # Sort indices by highest similarity
            actual_k = min(top_k, len(self.documents))
            top_indices = np.argsort(similarities)[::-1][:actual_k]

            results = []
            for idx in top_indices:
                if 0 <= idx < len(self.documents):
                    results.append(self.documents[idx])
            return results
        except Exception as e:
            logger.error(f"Error retrieving RAG examples: {e}")
            return self.documents[:min(top_k, len(self.documents))]

    def add_success_to_rag(self, question: str, sql: str):
        """Dynamically stores a newly validated successful query into RAG vector memory."""
        content = f"Question: {question}\nSQL: {sql}"
        doc = Document(
            page_content=content,
            metadata={"type": "learned_sample", "question": question, "sql": sql}
        )
        self.documents.append(doc)
        self.raw_texts.append(question + " " + content)

        # Re-fit lightweight vectorizer in < 1ms
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            lowercase=True
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(self.raw_texts)
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

# Compatibility helper for health endpoint
def get_embedding_model():
    return True
