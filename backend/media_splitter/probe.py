from __future__ import annotations

import shutil
import subprocess
from pathlib import Path
from typing import Optional

from .models import AUDIO_EXTS, VIDEO_EXTS, MediaKind


def require_ffmpeg() -> None:
    for tool in ("ffmpeg", "ffprobe"):
        if shutil.which(tool) is None:
            raise RuntimeError(
                f"{tool} not found on PATH. Install FFmpeg (apt install ffmpeg / brew install ffmpeg)."
            )


def media_kind(path: Path) -> Optional[MediaKind]:
    ext = path.suffix.lower()
    if ext in VIDEO_EXTS:
        return "video"
    if ext in AUDIO_EXTS:
        return "audio"
    return None


def get_duration(path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True, text=True,
    )
    if out.returncode != 0 or not out.stdout.strip():
        raise RuntimeError(f"ffprobe failed: {out.stderr.strip() or 'no duration'}")
    return float(out.stdout.strip())
