from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Literal, Optional

MediaKind = Literal["audio", "video"]

AUDIO_EXTS = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".wma"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v", ".flv", ".wmv"}

# (chunks_done, chunks_total, current_file_name)
ProgressCallback = Callable[[int, int, str], None]


@dataclass(frozen=True)
class SplitConfig:
    chunk_seconds: float
    # Output container for audio chunks. "wav" is lossless and best for spectrograms.
    audio_format: str = "wav"
    # True: re-encode video for exact cut points. False: stream copy (fast, but
    # cuts snap to keyframes so durations drift).
    accurate_video: bool = True
    # Ignore leftovers shorter than this (avoids a 0.02s final chunk).
    min_remainder: float = 0.05

    def __post_init__(self):
        if self.chunk_seconds <= 0:
            raise ValueError("chunk_seconds must be > 0")


@dataclass
class FileResult:
    source: str
    kind: Optional[MediaKind]
    chunks: int = 0
    error: Optional[str] = None


@dataclass
class SplitReport:
    zip_path: Path
    results: list[FileResult] = field(default_factory=list)

    @property
    def total_chunks(self) -> int:
        return sum(r.chunks for r in self.results)

    @property
    def failed(self) -> list[FileResult]:
        return [r for r in self.results if r.error]
