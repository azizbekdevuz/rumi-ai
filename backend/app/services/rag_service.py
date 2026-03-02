"""
RAG Service - FAISS vector store + Ollama embeddings for verse retrieval.

Builds the FAISS index in a background thread so that application startup
is not blocked by embedding calls to Ollama.
"""
from __future__ import annotations
import json, logging, threading
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
import httpx

from app.config import settings

logger = logging.getLogger(__name__)
_rag_instance: Optional["RAGService"] = None


def get_rag_service() -> "RAGService":
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGService()
    return _rag_instance


def _default_book_verse_dir() -> str:
    """Fall back to <project_root>/book_verse when BOOK_VERSE_DIR is unset."""
    return str(Path(__file__).resolve().parents[3] / "book_verse")


class RAGService:
    def __init__(self) -> None:
        self._ollama_url: str = settings.OLLAMA_BASE_URL
        self._embed_model: str = settings.EMBED_MODEL
        self._book_verse_dir: str = settings.BOOK_VERSE_DIR or _default_book_verse_dir()

        self.documents: List[Dict[str, Any]] = []
        self.index = None  # faiss.IndexFlatL2 — set by _build_index
        self.dimension: int = 0
        self._ready = threading.Event()

        self._load_documents()

    # ── public helpers ────────────────────────────────────────

    @property
    def is_ready(self) -> bool:
        """True once the background index build has completed."""
        return self._ready.is_set()

    def build_index_background(self) -> None:
        """Kick off index building in a daemon thread."""
        thread = threading.Thread(target=self._build_index, daemon=True)
        thread.start()

    # ── private ───────────────────────────────────────────────────

    def _load_documents(self) -> None:
        verse_dir = Path(self._book_verse_dir)
        if not verse_dir.exists():
            logger.warning('book_verse dir not found at %s', verse_dir)
            return
        json_files = sorted(verse_dir.glob('page_*.json'))
        logger.info('Found %d book_verse files in %s', len(json_files), verse_dir)
        for jf in json_files:
            try:
                with open(jf, encoding='utf-8') as fh:
                    data = json.load(fh)
                page_num = data.get('page', 0)
                for line in data.get('lines', []):
                    text = line.get('text', '').strip()
                    if len(text) < 5:
                        continue
                    self.documents.append({
                        'text': text, 'page': page_num,
                        'lang': line.get('lang', 'fas'),
                        'bbox': line.get('bbox'),
                        'source_file': jf.name,
                    })
            except Exception as exc:
                logger.error('Failed to read %s: %s', jf, exc)
        logger.info('Loaded %d text chunks from book_verse', len(self.documents))

    def _embed_texts(self, texts: List[str]) -> np.ndarray:
        url = f"{self._ollama_url}/api/embed"
        payload = {"model": self._embed_model, "input": texts}
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        embeddings = data.get('embeddings')
        if not embeddings:
            raise RuntimeError(f'No embeddings in response: {list(data.keys())}')
        return np.array(embeddings, dtype=np.float32)

    async def _embed_texts_async(self, texts: List[str]) -> np.ndarray:
        url = f"{self._ollama_url}/api/embed"
        payload = {"model": self._embed_model, "input": texts}
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        embeddings = data.get('embeddings')
        if not embeddings:
            raise RuntimeError('No embeddings in response')
        return np.array(embeddings, dtype=np.float32)

    def _build_index(self) -> None:
        """Build the FAISS index.  Safe to call from a background thread."""
        import faiss
        if not self.documents:
            logger.warning("No documents to index")
            self._ready.set()
            return
        logger.info('Building FAISS index for %d documents', len(self.documents))
        batch_size = 32
        all_embeddings = []
        texts = [doc['text'] for doc in self.documents]
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            logger.info(
                'Embedding batch %d/%d',
                i // batch_size + 1,
                (len(texts) + batch_size - 1) // batch_size,
            )
            emb = self._embed_texts(batch)
            all_embeddings.append(emb)
        embeddings = np.vstack(all_embeddings)
        self.dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(embeddings)
        self._ready.set()
        logger.info('FAISS index built: %d vectors, dim=%d', self.index.ntotal, self.dimension)

    async def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self._ready.is_set():
            logger.warning("RAG index not ready yet — returning empty results")
            return []
        if self.index is None or self.index.ntotal == 0:
            return []
        query_emb = await self._embed_texts_async([query])
        distances, indices = self.index.search(query_emb, top_k)
        results = []
        for rank, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < 0 or idx >= len(self.documents):
                continue
            doc = self.documents[idx]
            results.append({
                'text': doc['text'], 'page': doc['page'],
                'lang': doc.get('lang', 'fas'),
                'score': float(dist),
                'source_file': doc.get('source_file', ''),
                'rank': rank + 1,
            })
        logger.info('RAG retrieve: query=%r -> %d results', query[:60], len(results))
        return results
