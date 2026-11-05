from __future__ import annotations

import math
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Sequence

from .archive import build_zip, safe_extract
from .ffmpeg_ops import cut_audio_padded, cut_video
from .models import FileResult, ProgressCallback, SplitConfig, SplitReport
from .probe import get_duration, media_kind, require_ffmpeg


@dataclass
class _Job:
    src: Path
    rel_dir: Path        # folder inside the output zip
    kind: str
    duration: float
    n_chunks: int


def _chunk_count(duration: float, cfg: SplitConfig, kind: str) -> int:
    """How many chunks a source produces.

    Audio: always round up, because the final chunk is padded with silence
    (45s @ 30s -> 2 chunks: 30s + 15s audio + 15s silence).
    Video: the final chunk keeps its real length, and leftovers below
    ``min_remainder`` are dropped instead of emitting a near-empty clip.
    """
    if duration <= 0:
        return 0
    if kind == "audio":
        return max(1, math.ceil(duration / cfg.chunk_seconds))
    if duration <= cfg.min_remainder:
        return 0
    return max(1, math.ceil((duration - cfg.min_remainder) / cfg.chunk_seconds))


def _collect(
    inputs: Sequence[Path], scratch: Path, rel_prefix: Path = Path(), _depth: int = 0
) -> list[tuple[Path, Path]]:
    """Return (file, relative_path) pairs. Zips are extracted and walked recursively."""
    found: list[tuple[Path, Path]] = []
    for p in inputs:
        p = Path(p)
        if p.suffix.lower() == ".zip":
            if _depth >= 5:  # guard against nested-zip recursion bombs
                continue
            dest = scratch / f"zip_{uuid.uuid4().hex}"
            dest.mkdir(parents=True, exist_ok=True)
            for f in safe_extract(p, dest):
                rel = rel_prefix / f.relative_to(dest)
                if f.suffix.lower() == ".zip":
                    found.extend(_collect([f], scratch, rel.parent, _depth + 1))
                else:
                    found.append((f, rel))
        else:
            found.append((p, rel_prefix / p.name))
    return found


def split_media(
    inputs: Sequence[Path | str],
    config: SplitConfig,
    out_zip: Path | str,
    work_dir: Optional[Path | str] = None,
    on_progress: Optional[ProgressCallback] = None,
    on_mel_progress: Optional[ProgressCallback] = None,
) -> SplitReport:
    """
    Main entry point. Takes video/audio files and/or zips, writes one zip of chunks.

    Output layout inside the zip: <source_stem>/<source_stem>_001.<ext>, ...
    (Zip sub-folders are preserved: folder/clip.mp4 -> folder/clip/clip_001.mp4)
    """
    require_ffmpeg()
    out_zip = Path(out_zip)
    inputs = [Path(p) for p in inputs]

    own_tmp = work_dir is None
    root = Path(tempfile.mkdtemp(prefix="split_")) if own_tmp else Path(work_dir)
    scratch, out_dir = root / "scratch", root / "out"
    scratch.mkdir(parents=True, exist_ok=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        results: list[FileResult] = []
        jobs: list[_Job] = []
        used_dirs: set[Path] = set()

        for f, rel in _collect(inputs, scratch):
            kind = media_kind(f)
            if kind is None:
                results.append(FileResult(str(rel), None, error="unsupported file type"))
                continue
            try:
                dur = get_duration(f)
            except Exception as e:
                results.append(FileResult(str(rel), kind, error=str(e)))
                continue

            rel_dir = rel.parent / rel.stem
            n = 1
            while rel_dir in used_dirs:           # same name from different uploads
                n += 1
                rel_dir = rel.parent / f"{rel.stem}_{n}"
            used_dirs.add(rel_dir)
            # Extracted video audio goes through the audio pipeline: padded
            # final clip, chosen format/bitrate, and optional spectrogram.
            output_kind = "audio" if kind == "video" and config.video_output == "audio" else kind
            jobs.append(_Job(f, rel_dir, output_kind, dur, _chunk_count(dur, config, output_kind)))

        total = sum(j.n_chunks for j in jobs)
        done = 0
        audio_outputs: list[Path] = []
        mel_total = sum(j.n_chunks for j in jobs if j.kind == "audio") if config.mel else 0
        if on_progress:
            on_progress(0, total, "")
        if on_mel_progress and mel_total:
            on_mel_progress(0, mel_total, "")

        for job in jobs:
            res = FileResult(str(job.src.name), job.kind)
            target = out_dir / job.rel_dir
            target.mkdir(parents=True, exist_ok=True)
            ext = ("." + config.audio_format) if job.kind == "audio" else job.src.suffix.lower()
            if job.kind == "video" and config.accurate_video:
                # We re-encode to H.264/AAC, which WebM/AVI/FLV/WMV cannot hold.
                if ext not in {".mp4", ".mov", ".mkv", ".m4v"}:
                    ext = ".mp4"

            try:
                for i in range(job.n_chunks):
                    start = i * config.chunk_seconds
                    dst = target / f"{job.src.stem}_{i + 1:03d}{ext}"
                    if job.kind == "video":
                        length = min(config.chunk_seconds, job.duration - start)
                        cut_video(job.src, dst, start, length, config.accurate_video)
                    else:
                        cut_audio_padded(
                            job.src, dst, start, config.chunk_seconds,
                            config.audio_format, config.audio_bitrate,
                        )
                        audio_outputs.append(dst)
                    res.chunks += 1
                    done += 1
                    if on_progress:
                        on_progress(done, total, job.src.name)
            except Exception as e:
                res.error = str(e)
            results.append(res)

        if config.mel and audio_outputs:
            from .spectrogram import render_mel_png  # lazy: numpy/matplotlib only needed here

            for i, clip in enumerate(audio_outputs, 1):
                try:
                    render_mel_png(clip, clip.with_suffix(".png"), config.chunk_seconds, config.mel)
                except Exception as e:
                    results.append(FileResult(f"{clip.name} (spectrogram)", "audio", error=str(e)))
                if on_mel_progress:
                    on_mel_progress(i, len(audio_outputs), clip.name)

        build_zip(out_dir, out_zip)
        return SplitReport(zip_path=out_zip, results=results)
    finally:
        if own_tmp:
            import shutil
            shutil.rmtree(root, ignore_errors=True)
