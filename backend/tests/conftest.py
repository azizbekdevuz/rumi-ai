"""Pytest configuration for backend tests."""
import sys
from pathlib import Path

# Add backend app to path
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))
