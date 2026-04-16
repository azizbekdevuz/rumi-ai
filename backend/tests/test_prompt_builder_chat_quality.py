"""Targeted tests for chat-quality fixes (routing, parsing, RAG caution helper)."""
from app.services import prompt_builder
from app.services.chat_service import _rag_retrieval_is_ambiguous


class TestClassifyQueryResponseMode:
    def test_junk_punctuation_only(self):
        assert prompt_builder.classify_query_response_mode("?") == "unclear"
        assert prompt_builder.classify_query_response_mode("  ???  ") == "unclear"

    def test_meaning_question_defaults_to_explanation(self):
        assert (
            prompt_builder.classify_query_response_mode(
                "What does this line mean in the Masnavi?"
            )
            == "explanation"
        )

    def test_persian_meaning_question(self):
        assert (
            prompt_builder.classify_query_response_mode(
                "معنای این بیت در مثنوی چیست؟"
            )
            == "explanation"
        )

    def test_explicit_advice_request_is_full(self):
        assert (
            prompt_builder.classify_query_response_mode(
                "Please give me practical advice on how to apply this to my life."
            )
            == "full"
        )


class TestParseLlmResponse:
    def test_labeled_sections_parsed(self):
        raw = (
            "Interpretation: Here is the literary meaning.\n\n"
            "Practical Advice: Do something kind each day."
        )
        r = prompt_builder.parse_llm_response(raw, "EN", expect_advice=True)
        assert r["structured_ok"] is True
        assert "literary" in r["interpretation"].lower()
        assert "kind" in r["advice"].lower()

    def test_unlabeled_multiparagraph_does_not_invent_advice(self):
        raw = (
            "The verse speaks of the soul's journey toward truth.\n\n"
            "Rumi often uses the reed flute as a metaphor for separation "
            "from the divine source."
        )
        r = prompt_builder.parse_llm_response(raw, "EN", expect_advice=True)
        assert r["structured_ok"] is False
        assert r["advice"] == ""
        assert "reed" in r["interpretation"].lower()

    def test_short_garbage_returns_empty(self):
        r = prompt_builder.parse_llm_response("ok", "EN", expect_advice=True)
        assert r["structured_ok"] is False
        assert r["interpretation"] == ""
        assert r["advice"] == ""

    def test_expect_advice_false_strips_advice_even_when_labeled(self):
        raw = (
            "Interpretation: Only this matters.\n\n"
            "Practical Advice: Should be ignored for this mode."
        )
        r = prompt_builder.parse_llm_response(raw, "EN", expect_advice=False)
        assert r["structured_ok"] is True
        assert "matters" in r["interpretation"]
        assert r["advice"] == ""


class TestRagAmbiguous:
    def test_single_hit_not_ambiguous(self):
        assert _rag_retrieval_is_ambiguous([{"score": 0.5}]) is False

    def test_clear_gap_not_ambiguous(self):
        docs = [{"score": 0.5}, {"score": 2.0}]
        assert _rag_retrieval_is_ambiguous(docs) is False

    def test_close_scores_ambiguous(self):
        docs = [{"score": 0.5}, {"score": 0.62}]
        assert _rag_retrieval_is_ambiguous(docs) is True


class TestSanitizeHistory:
    def test_assistant_truncated_more_than_user(self):
        long_a = "x" * 500
        long_u = "y" * 500
        hist = [
            {"role": "user", "content": long_u},
            {"role": "assistant", "content": long_a},
        ]
        out = prompt_builder.sanitize_history_for_prompt(hist, max_turns=4)
        assert len(out[0]["content"]) <= 361
        assert len(out[1]["content"]) <= 121
        assert out[1]["content"].endswith("…")
