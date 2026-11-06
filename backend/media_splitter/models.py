from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Literal, Optional

MediaKind = Literal["audio", "video"]

# Allowed lossy audio bitrates in kbps. 64 is the floor (small speech files),
# 320 is the ceiling (transparent for most listeners).
AUDIO_BITRATES = (64, 128, 192, 256, 320)

AUDIO_EXTS = {".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".wma"}
VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v", ".flv", ".wmv"}

# (chunks_done, chunks_total, current_file_name)
ProgressCallback = Callable[[int, int, str], None]


@dataclass(frozen=True)
class MelConfig:
    """Defaults mirror the speech setup: 16 kHz, 25 ms window, 10 ms hop, 80 mel bins."""
    sample_rate: int = 16000
    n_fft: int = 400
    win_length: int = 400
    hop_length: int = 160
    n_mels: int = 80
    f_min: float = 0.0
    f_max: float = 8000.0
    power: float = 2.0
    top_db: float = 80.0

    def __post_init__(self):
        if not 8000 <= self.sample_rate <= 48000:
            raise ValueError("sample_rate must be between 8000 and 48000")
        if not 16 <= self.n_fft <= 8192:
            raise ValueError("n_fft must be between 16 and 8192")
        if not 1 <= self.win_length <= self.n_fft:
            raise ValueError("win_length must be between 1 and n_fft")
        if not 1 <= self.hop_length <= self.n_fft:
            raise ValueError("hop_length must be between 1 and n_fft")
        if not 1 <= self.n_mels <= 512:
            raise ValueError("n_mels must be between 1 and 512")
        if not 0 <= self.f_min < self.f_max <= self.sample_rate / 2:
            raise ValueError("need 0 <= f_min < f_max <= sample_rate / 2")
        if self.power <= 0:
            raise ValueError("power must be > 0")


@dataclass(frozen=True)
class SplitConfig:
    chunk_seconds: float
    # Output container for audio chunks. "wav" is lossless and best for spectrograms.
    audio_format: str = "wav"
    # Lossy audio bitrate in kbps (one of AUDIO_BITRATES). Ignored for wav/flac.
    audio_bitrate: int = 192
    # True: re-encode video for exact cut points. False: stream copy (fast, but
    # cuts snap to keyframes so durations drift).
    accurate_video: bool = True
    # "video" splits video files as-is; "audio" extracts their soundtrack into
    # padded audio clips using audio_format/audio_bitrate (and mel if enabled).
    video_output: str = "video"
    # False: <source>/<source>_001.ext (one folder per source, zip folders kept).
    # True: every clip lands at the zip root with a unique <source>_001.ext name.
    single_folder: bool = False
    # Which generated artifacts go into the result zip. Spectrograms can only
    # be included when ``mel`` is set (and are useless without a media clip).
    include_media: bool = True
    include_spectrograms: bool = True
    # Ignore leftovers shorter than this (avoids a 0.02s final chunk).
    min_remainder: float = 0.05
    # When set, every audio clip also gets a mel spectrogram PNG next to it.
    mel: Optional[MelConfig] = None

    def __post_init__(self):
        if self.chunk_seconds <= 0:
            raise ValueError("chunk_seconds must be > 0")
        if self.audio_bitrate not in AUDIO_BITRATES:
            raise ValueError(f"audio_bitrate must be one of {AUDIO_BITRATES}")
        if self.video_output not in {"video", "audio"}:
            raise ValueError("video_output must be 'video' or 'audio'")
        if not self.include_media and not self.include_spectrograms:
            raise ValueError("at least one of include_media/include_spectrograms must be True")


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
