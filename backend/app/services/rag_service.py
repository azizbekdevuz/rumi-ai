"""
RAG Service — FAISS vector store + Ollama embeddings for verse retrieval.

Builds the FAISS index in a background thread so that application startup
is not blocked by embedding calls to Ollama.

Dependencies:
  • faiss-cpu   – vector similarity search (optional; logs CRITICAL if missing)
  • numpy       – array handling for embeddings
  • httpx       – async + sync HTTP client for Ollama embedding API
"""
from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional
import re
from collections import defaultdict

import numpy as np
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── Guarded FAISS import ──────────────────────────────────────────
try:
    import faiss  # type: ignore[import-untyped]
except ImportError:
    faiss = None  # type: ignore[assignment]
    logger.critical(
        "faiss-cpu is not installed.  RAG vector retrieval will be DISABLED.  "
        "Install with:  pip install faiss-cpu>=1.7.0"
    )

# ── Module-level singleton ────────────────────────────────────────
_rag_instance: Optional["RAGService"] = None


def get_rag_service() -> "RAGService":
    """Return (or create) the module-level RAGService singleton."""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGService()
    return _rag_instance


def get_rag_status() -> Dict[str, Any]:
    """Return current RAG service status for health-check endpoints."""
    if _rag_instance is None:
        return {"ready": False, "documents": 0, "faiss_available": faiss is not None}
    return {
        "ready": _rag_instance.is_ready,
        "documents": (
            _rag_instance.index.ntotal
            if _rag_instance.is_ready and _rag_instance.index
            else 0
        ),
        "faiss_available": faiss is not None,
    }


def _default_book_verse_dir() -> str:
    """Fall back to <project_root>/book_verse when BOOK_VERSE_DIR is unset."""
    return str(Path(__file__).resolve().parents[3] / "book_verse")


# ── Service class ─────────────────────────────────────────────────


class RAGService:
    """FAISS-backed retrieval service that embeds book_verse JSON via Ollama."""

    def __init__(self) -> None:
        self._ollama_url: str = settings.OLLAMA_BASE_URL
        self._embed_model: str = settings.EMBED_MODEL
        self._book_verse_dir: str = settings.BOOK_VERSE_DIR or _default_book_verse_dir()

        self.documents: List[Dict[str, Any]] = []
        self.index: Optional[Any] = None  # faiss.IndexFlatL2 once built
        self.dimension: int = 0
        self._ready = threading.Event()

        # If faiss is not installed, mark as ready-but-empty immediately
        # so callers don't block forever on is_ready.
        if faiss is None:
            logger.warning("FAISS unavailable — RAG will return empty results")
            self._ready.set()
        else:
            self._load_documents()

    # ── Public helpers ────────────────────────────────────────────

    @property
    def is_ready(self) -> bool:
        """True once the background index build has completed (or faiss is missing)."""
        return self._ready.is_set()

    def build_index_background(self) -> None:
        """Kick off index building in a daemon thread."""
        if faiss is None:
            logger.warning("Skipping FAISS index build — faiss-cpu not installed")
            return
        if not self.documents:
            logger.warning("No documents loaded — skipping FAISS index build")
            self._ready.set()
            return
        thread = threading.Thread(target=self._build_index, daemon=True)
        thread.start()

    # ── Async retrieval (called from chat pipeline) ───────────────

    async def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve the *top_k* most similar documents for *query*.

        Returns a list of dicts with keys:
          text, page, lang, score, source_file, rank,
          chapter, verse, book (from book_verse JSON when present)
        """
        if faiss is None:
            return []
        if not self._ready.is_set():
            logger.warning("RAG index not ready yet — returning empty results")
            return []
        if self.index is None or self.index.ntotal == 0:
            return []

        query_emb = await self._embed_texts_async([query])
        distances, indices = self.index.search(query_emb, top_k)

        results: List[Dict[str, Any]] = []
        for rank, (dist, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < 0 or idx >= len(self.documents):
                continue
            doc = self.documents[idx]
            results.append({
                "text": doc["text"],
                "page": doc["page"],
                "lang": doc.get("lang", "fas"),
                "score": float(dist),
                "source_file": doc.get("source_file", ""),
                "rank": rank + 1,
                "chapter": doc.get("chapter"),
                "verse": doc.get("verse"),
                "book": doc.get("book"),
            })

        logger.info(
            "RAG retrieve: query=%r -> %d results (top_score=%.4f)",
            query[:60],
            len(results),
            results[0]["score"] if results else 0.0,
        )
        return results

    # ── Private: document loading ─────────────────────────────────

    def clean_text(self, text: str) -> str:
        if not text:
            return ""

        text = re.sub(r"[\u200c\u200d\u200e\u200f\u061c\u202a-\u202e\u2066-\u2069]", "", text)
        text = re.sub(r"\s+", " ", text)

        return text.strip()

    def _load_documents(self) -> None:
        """Load text chunks from book_verse/page_*.json files."""
        verse_dir = Path(self._book_verse_dir)
        if not verse_dir.exists():
            logger.warning("book_verse dir not found at %s", verse_dir)
            return
        json_files = sorted(verse_dir.glob("page_*.json"))
        logger.info("Found %d book_verse files in %s", len(json_files), verse_dir)

        for jf in json_files:
            try:
                with open(jf, encoding="utf-8") as fh:
                    data = json.load(fh)

                page_num = data.get("page", 0)
                book_num = data.get("book")
                raw_lines = data.get("lines")
                if raw_lines is None:
                    lines: List[Any] = []
                elif not isinstance(raw_lines, list):
                    logger.warning(
                        "book_verse %s: expected lines to be a list, got %s — skipping file",
                        jf.name,
                        type(raw_lines).__name__,
                    )
                    continue
                else:
                    lines = raw_lines

                grouped = defaultdict(list)
                meta: Dict[Any, Dict[str, Any]] = {}
                for line in lines:
                    try:
                        if not isinstance(line, dict):
                            logger.warning(
                                "book_verse %s: skipping non-object line (%s)",
                                jf.name,
                                type(line).__name__,
                            )
                            continue
                        raw_text = line.get("text")
                        if raw_text is None:
                            continue
                        if not isinstance(raw_text, str):
                            logger.warning(
                                "book_verse %s: skipping line with non-string text (%s)",
                                jf.name,
                                type(raw_text).__name__,
                            )
                            continue
                        text = self.clean_text(raw_text)
                        if len(text) < 5:
                            continue

                        chapter = line.get("chapter")
                        verse = line.get("verse")
                        lang = line.get("lang", "fas")
                        key = (chapter, verse)

                        grouped[key].append(text)
                        if key not in meta:
                            meta[key] = {
                                "chapter": chapter,
                                "verse": verse,
                                "book": line.get("book", book_num),
                                "page": page_num,
                                "lang": lang,
                                "source_file": jf.name,
                            }
                    except TypeError as exc:
                        logger.warning(
                            "book_verse %s: skipping line (invalid grouping key: %s)",
                            jf.name,
                            exc,
                        )
                        continue
                for key, text_parts in grouped.items():
                    full_text = self.clean_text(" ".join(text_parts))
                    if len(full_text) < 5:
                        continue
                    item = {
                        "text": full_text,
                        **meta[key],
                    }
                    self.documents.append(item)
            except Exception as exc:
                logger.error("Failed to read %s: %s", jf, exc)

        logger.info("Loaded %d text chunks from book_verse", len(self.documents))

    # ── Private: embedding ────────────────────────────────────────

    def _embed_texts(self, texts: List[str]) -> np.ndarray:
        """Synchronous embedding via Ollama /api/embed (used by background thread)."""
        url = f"{self._ollama_url}/api/embed"
        payload = {"model": self._embed_model, "input": texts}
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        embeddings = data.get("embeddings")
        if not embeddings:
            raise RuntimeError(f"No embeddings in Ollama response: {list(data.keys())}")
        return np.array(embeddings, dtype=np.float32)

    async def _embed_texts_async(self, texts: List[str]) -> np.ndarray:
        """Async embedding via Ollama /api/embed (used by retrieve)."""
        url = f"{self._ollama_url}/api/embed"
        payload = {"model": self._embed_model, "input": texts}
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        embeddings = data.get("embeddings")
        if not embeddings:
            raise RuntimeError("No embeddings in Ollama response")
        return np.array(embeddings, dtype=np.float32)

    # ── Private: index building ───────────────────────────────────

    def _build_index(self) -> None:
        """Build the FAISS index.  Safe to call from a background thread."""
        if faiss is None:
            self._ready.set()
            return
        if not self.documents:
            logger.warning("No documents to index")
            self._ready.set()
            return

        logger.info("Building FAISS index for %d documents …", len(self.documents))
        batch_size = 32
        all_embeddings: List[np.ndarray] = []
        texts = [doc["text"] for doc in self.documents]

        try:
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                logger.info(
                    "Embedding batch %d/%d",
                    i // batch_size + 1,
                    (len(texts) + batch_size - 1) // batch_size,
                )
                emb = self._embed_texts(batch)
                all_embeddings.append(emb)

            embeddings = np.vstack(all_embeddings)
            self.dimension = embeddings.shape[1]
            self.index = faiss.IndexFlatL2(self.dimension)
            self.index.add(embeddings)
            logger.info(
                "FAISS index built: %d vectors, dim=%d",
                self.index.ntotal,
                self.dimension,
            )
        except Exception as exc:
            logger.error("FAISS index build failed: %s", exc, exc_info=True)
        finally:
            # Always mark ready so callers don't block forever.
            self._ready.set()
