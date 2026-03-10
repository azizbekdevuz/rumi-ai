"""Regression tests for LLM generation service - malformed choices handling."""
import pytest
from app.services.llm_generation import LLMGenerationService


class TestLLMGenerationExtractText:
    """Test _extract_text handles malformed OpenAI-compatible responses."""

    def setup_method(self):
        self.service = LLMGenerationService()
        # Force non-Ollama path so we hit the choices branch
        self.service.is_ollama = False

    def test_valid_choices_returns_content(self):
        data = {"choices": [{"message": {"content": "Hello there"}}]}
        assert self.service._extract_text(data) == "Hello there"

    def test_empty_choices_raises_runtime_error(self):
        data = {"choices": []}
        with pytest.raises(RuntimeError, match="No choices"):
            self.service._extract_text(data)

    def test_missing_choices_raises_runtime_error(self):
        data = {}
        with pytest.raises(RuntimeError, match="No choices"):
            self.service._extract_text(data)

    def test_choices_first_element_not_dict_raises_runtime_error(self):
        data = {"choices": ["not a dict"]}
        with pytest.raises(RuntimeError, match="Unexpected choices"):
            self.service._extract_text(data)

    def test_choices_first_element_missing_message_raises_runtime_error(self):
        data = {"choices": [{}]}
        with pytest.raises(RuntimeError, match="message"):
            self.service._extract_text(data)

    def test_message_not_dict_raises_runtime_error(self):
        data = {"choices": [{"message": "string not dict"}]}
        with pytest.raises(RuntimeError, match="message"):
            self.service._extract_text(data)

    def test_message_missing_content_raises_runtime_error(self):
        data = {"choices": [{"message": {}}]}
        with pytest.raises(RuntimeError, match="No content"):
            self.service._extract_text(data)

    def test_content_none_raises_runtime_error(self):
        data = {"choices": [{"message": {"content": None}}]}
        with pytest.raises(RuntimeError, match="No content"):
            self.service._extract_text(data)

    def test_empty_string_content_returns_empty_string(self):
        data = {"choices": [{"message": {"content": ""}}]}
        assert self.service._extract_text(data) == ""
