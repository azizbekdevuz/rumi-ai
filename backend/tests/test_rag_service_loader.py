"""Tests for RAGService book_verse JSON loading (hardening + grouped-verse shape)."""
import json
from pathlib import Path

from app.services.rag_service import RAGService


def _bare_service() -> RAGService:
    """Build instance without running __init__ (avoids faiss / full corpus load)."""
    svc = RAGService.__new__(RAGService)
    svc.documents = []
    return svc


def _branch_doc_keys() -> set[str]:
    """Stored document keys on rag_service-json-update (no bbox)."""
    return {"text", "page", "lang", "source_file", "chapter", "verse", "book"}


def test_load_documents_lines_null_treated_as_empty(tmp_path: Path) -> None:
    """`lines: null` must not raise; file contributes no docs."""
    page = tmp_path / "page_99.json"
    page.write_text(
        json.dumps({"page": 99, "book": 1, "lines": None}, ensure_ascii=False),
        encoding="utf-8",
    )
    svc = _bare_service()
    svc._book_verse_dir = str(tmp_path)
    svc._load_documents()
    assert svc.documents == []


def test_load_documents_skips_non_string_text_keeps_other_lines(tmp_path: Path) -> None:
    """Non-string `text` skips that line; other lines in the same file still load."""
    page = tmp_path / "page_98.json"
    good = "x" * 10
    page.write_text(
        json.dumps(
            {
                "page": 98,
                "book": 1,
                "lines": [
                    {"text": 12345, "chapter": 1, "verse": 1, "book": 1, "lang": "fas"},
                    {"text": good, "chapter": 1, "verse": 2, "book": 1, "lang": "fas"},
                ],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    svc = _bare_service()
    svc._book_verse_dir = str(tmp_path)
    svc._load_documents()
    assert len(svc.documents) == 1
    assert svc.documents[0]["text"] == good
    assert svc.documents[0]["page"] == 98
    assert svc.documents[0]["verse"] == 2


def test_load_documents_wrong_lines_type_skips_file(tmp_path: Path) -> None:
    """Non-list `lines` skips the file without crashing the run."""
    page = tmp_path / "page_97.json"
    page.write_text(
        json.dumps({"page": 97, "book": 1, "lines": {"not": "a list"}}, ensure_ascii=False),
        encoding="utf-8",
    )
    svc = _bare_service()
    svc._book_verse_dir = str(tmp_path)
    svc._load_documents()
    assert svc.documents == []


def test_load_documents_skips_non_dict_line(tmp_path: Path) -> None:
    """Non-dict entries in `lines` are skipped; valid dict lines still load."""
    page = tmp_path / "page_96.json"
    good = "y" * 10
    page.write_text(
        json.dumps(
            {
                "page": 96,
                "book": 1,
                "lines": [
                    "not-an-object",
                    {"text": good, "chapter": 1, "verse": 1, "book": 1, "lang": "fas"},
                ],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    svc = _bare_service()
    svc._book_verse_dir = str(tmp_path)
    svc._load_documents()
    assert len(svc.documents) == 1
    assert svc.documents[0]["text"] == good


def test_load_documents_text_null_skips_line_other_lines_load(tmp_path: Path) -> None:
    """`text: null` skips that line only; remaining valid lines still load."""
    page = tmp_path / "page_95.json"
    good = "z" * 10
    page.write_text(
        json.dumps(
            {
                "page": 95,
                "book": 1,
                "lines": [
                    {"text": None, "chapter": 1, "verse": 1, "book": 1, "lang": "fas"},
                    {"text": good, "chapter": 1, "verse": 2, "book": 1, "lang": "fas"},
                ],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    svc = _bare_service()
    svc._book_verse_dir = str(tmp_path)
    svc._load_documents()
    assert len(svc.documents) == 1
    assert svc.documents[0]["text"] == good


def test_load_documents_groups_same_chapter_verse(tmp_path: Path) -> None:
    """Two lines with the same (chapter, verse) merge into one stored document."""
    page = tmp_path / "page_5.json"
    a = "a" * 10
    b = "b" * 10
    page.write_text(
        json.dumps(
            {
                "page": 5,
                "book": 1,
                "lines": [
                    {"text": a, "chapter": 1, "verse": 2, "book": 1, "lang": "fas"},
                    {"text": b, "chapter": 1, "verse": 2, "book": 1, "lang": "fas"},
                ],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    svc = _bare_service()
    svc._book_verse_dir = str(tmp_path)
    svc._load_documents()
    assert len(svc.documents) == 1
    doc = svc.documents[0]
    assert set(doc.keys()) == _branch_doc_keys()
    assert doc["chapter"] == 1
    assert doc["verse"] == 2
    assert doc["book"] == 1
    assert doc["page"] == 5
    assert doc["lang"] == "fas"
    assert doc["source_file"] == "page_5.json"
    assert a in doc["text"] and b in doc["text"]
    assert "bbox" not in doc


def test_load_documents_valid_two_verses_two_documents(tmp_path: Path) -> None:
    """Different (chapter, verse) pairs produce separate documents; short line skipped."""
    page = tmp_path / "page_6.json"
    v1 = "m" * 10
    v2 = "n" * 10
    page.write_text(
        json.dumps(
            {
                "page": 6,
                "book": 1,
                "lines": [
                    {"text": "x", "chapter": 1, "verse": 1, "book": 1, "lang": "fas"},
                    {"text": v1, "chapter": 1, "verse": 1, "book": 1, "lang": "fas"},
                    {"text": v2, "chapter": 1, "verse": 2, "book": 1, "lang": "kr"},
                ],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    svc = _bare_service()
    svc._book_verse_dir = str(tmp_path)
    svc._load_documents()
    assert len(svc.documents) == 2
    assert set(svc.documents[0].keys()) == _branch_doc_keys()
    assert set(svc.documents[1].keys()) == _branch_doc_keys()
    verses = {d["verse"] for d in svc.documents}
    assert verses == {1, 2}
    by_verse = {d["verse"]: d for d in svc.documents}
    assert by_verse[1]["text"] == v1
    assert by_verse[2]["text"] == v2
    assert by_verse[1]["lang"] == "fas"
    assert by_verse[2]["lang"] == "kr"