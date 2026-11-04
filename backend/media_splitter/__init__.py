"""Public API for the media splitter package.

The notebook, CLI and FastAPI app all import from the package root
(``from media_splitter import SplitConfig, split_media``), so the symbols
must be re-exported here.
"""
from __future__ import annotations

from .models import FileResult, SplitConfig, SplitReport
from .pipeline import split_media

__all__ = ["FileResult", "SplitConfig", "SplitReport", "split_media"]
