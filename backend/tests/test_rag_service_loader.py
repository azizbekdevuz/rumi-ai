"""Tests for RAGService book_verse JSON loading (edge cases that must not abort a whole page file)."""
import json
from pathlib import Path

from app.services.rag_service import RAGService


def _bare_service() -> RAGService:
    """Build instance without running __init__ (avoids faiss / full corpus load)."""
    svc = RAGService.__new__(RAGService)
    svc.documents = []
    return svc


def test_load_documents_lines_null_treated_as_empty(tmp_path: Path) -> None:
    """`lines: null` must not raise; file contributes no docs (same as empty array)."""
    page = tmp_path / "page_99.json"
    page.write_text(
        json.dumps({"page": 99, "lines": None}, ensure_ascii=False),
        encoding="utf-8",
    )
    svc = _bare_service()
    svc._book_verse_dir = str(tmp_path)
    svc._load_documents()
    assert svc.documents == []


def test_load_documents_skips_non_string_text_keeps_other_lines(tmp_path: Path) -> None:
    """A line with invalid `text` type must not prevent other lines in the same file from loading."""
    page = tmp_path / "page_98.json"
    good = "x" * 10
    page.write_text(
        json.dumps(
            {
                "page": 98,
                "lines": [
                    {"text": 12345, "lang": "fas"},
                    {"text": good, "lang": "fas"},
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


def test_load_documents_wrong_lines_type_skips_file(tmp_path: Path) -> None:
    """Non-list `lines` skips the file without crashing the run."""
    page = tmp_path / "page_97.json"
    page.write_text(
        json.dumps({"page": 97, "lines": {"not": "a list"}}, ensure_ascii=False),
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
                "lines": [
                    "not-an-object",
                    {"text": good, "lang": "fas"},
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
                "lines": [
                    {"text": None, "lang": "fas"},
                    {"text": good, "lang": "fas"},
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


def test_load_documents_valid_multiline_preserves_shape(tmp_path: Path) -> None:
    """Valid page JSON loads all qualifying lines with existing document fields."""
    page = tmp_path / "page_5.json"
    a = "۱" + "a" * 9  # len >= 5 after strip
    b = "b" * 12
    bbox = [1, 2, 3, 4]
    page.write_text(
        json.dumps(
            {
                "page": 5,
                "lines": [
                    {"text": "x", "lang": "fas"},  # too short after strip
                    {"text": a, "lang": "fas", "bbox": bbox, "verse": 1},
                    {"text": b, "lang": "kr", "bbox": bbox, "verse": 2},
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
    assert svc.documents[0] == {
        "text": a,
        "page": 5,
        "lang": "fas",
        "bbox": bbox,
        "source_file": "page_5.json",
    }
    assert svc.documents[1]["text"] == b
    assert svc.documents[1]["page"] == 5
    assert svc.documents[1]["lang"] == "kr"
    assert svc.documents[1]["bbox"] == bbox
    assert svc.documents[1]["source_file"] == "page_5.json"
