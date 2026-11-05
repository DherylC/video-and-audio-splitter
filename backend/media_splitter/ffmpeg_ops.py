from __future__ import annotations

import subprocess
from pathlib import Path

# Containers that accept the mov/mp4 muxer flag `+faststart`.
_FASTSTART_EXTS = {".mp4", ".m4v", ".mov"}

# Explicit encoder per lossy container so `-b:a` always has a target codec.
_LOSSY_AUDIO_CODECS = {"mp3": "libmp3lame", "m4a": "aac", "ogg": "libvorbis"}


def _run(cmd: list[str]) -> None:
    res = subprocess.run(cmd, capture_output=True, text=True, stdin=subprocess.DEVNULL)
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip()[-500:] or "ffmpeg failed")


def cut_video(src: Path, dst: Path, start: float, length: float, accurate: bool) -> None:
    """Cut [start, start+length). A short tail is kept as-is (no padding)."""
    cmd = ["ffmpeg", "-nostdin", "-y", "-v", "error",
           "-ss", f"{start:.3f}", "-i", str(src), "-t", f"{length:.3f}",
           "-map", "0:v:0?", "-map", "0:a:0?"]
    if accurate:
        # Re-encode so the cut points are frame-exact. yuv420p keeps the output
        # playable in browsers/social apps even when the source is 10-bit/HDR.
        # Round odd dimensions down by 1px: yuv420p/H.264 requires even sizes.
        cmd += ["-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-pix_fmt", "yuv420p", "-c:a", "aac"]
        if dst.suffix.lower() in _FASTSTART_EXTS:
            cmd += ["-movflags", "+faststart"]
    else:
        cmd += ["-c", "copy", "-avoid_negative_ts", "make_zero"]
    cmd.append(str(dst))
    _run(cmd)


def cut_audio_padded(
    src: Path,
    dst: Path,
    start: float,
    chunk: float,
    audio_format: str,
    audio_bitrate: int = 192,
) -> None:
    """Cut a chunk and pad the tail with silence so every output is exactly `chunk` seconds."""
    cmd = ["ffmpeg", "-nostdin", "-y", "-v", "error",
           "-ss", f"{start:.3f}", "-i", str(src),
           "-vn", "-af", f"apad=whole_dur={chunk:.3f}", "-t", f"{chunk:.3f}"]
    if audio_format == "wav":
        cmd += ["-c:a", "pcm_s16le"]
    elif audio_format == "flac":
        cmd += ["-c:a", "flac"]
    elif audio_format in _LOSSY_AUDIO_CODECS:
        cmd += ["-c:a", _LOSSY_AUDIO_CODECS[audio_format],
                "-b:a", f"{audio_bitrate}k"]
    cmd.append(str(dst))
    _run(cmd)
