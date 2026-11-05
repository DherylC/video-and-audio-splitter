"""In-memory job registry. Single-process only; swap for Redis/DB if you scale out."""
from __future__ import annotations

import shutil
import tempfile
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from media_splitter import SplitConfig, split_media

JOB_TTL_SECONDS = 60 * 60
_executor = ThreadPoolExecutor(max_workers=2)  # concurrent jobs
_jobs: dict[str, "Job"] = {}
_lock = threading.Lock()


@dataclass
class Job:
    id: str
    dir: Path
    created: float = field(default_factory=time.time)
    status: str = "queued"  # queued | running | done | error
    done: int = 0
    total: int = 0
    current: str = ""
    error: Optional[str] = None
    zip_path: Optional[Path] = None
    failed: list[dict] = field(default_factory=list)
    stage: str = "splitting"  # splitting | spectrogram
    mel_done: int = 0
    mel_total: int = 0

    def public(self) -> dict:
        return {
            "id": self.id, "status": self.status, "done": self.done, "total": self.total,
            "current": self.current, "error": self.error, "failed": self.failed,
            "stage": self.stage, "mel_done": self.mel_done, "mel_total": self.mel_total,
        }


def _purge_expired() -> None:
    cutoff = time.time() - JOB_TTL_SECONDS
    with _lock:
        stale = [j for j in _jobs.values() if j.created < cutoff and j.status in ("done", "error")]
        for j in stale:
            _jobs.pop(j.id, None)
            shutil.rmtree(j.dir, ignore_errors=True)


def create_job() -> Job:
    _purge_expired()
    job = Job(id=uuid.uuid4().hex, dir=Path(tempfile.mkdtemp(prefix="job_")))
    (job.dir / "uploads").mkdir()
    with _lock:
        _jobs[job.id] = job
    return job


def get_job(job_id: str) -> Optional[Job]:
    with _lock:
        return _jobs.get(job_id)


def _run(job: Job, inputs: list[Path], cfg: SplitConfig) -> None:
    job.status = "running"

    def on_progress(done: int, total: int, name: str) -> None:
        job.done, job.total = done, total
        if name:
            job.current = name

    def on_mel_progress(done: int, total: int, name: str) -> None:
        job.mel_done, job.mel_total = done, total
        if done > 0:  # the 0/total call only announces the total
            job.stage, job.current = "spectrogram", name

    try:
        report = split_media(
            inputs, cfg, job.dir / "result.zip",
            work_dir=job.dir / "work", on_progress=on_progress, on_mel_progress=on_mel_progress,
        )
        job.zip_path = report.zip_path
        job.failed = [{"source": r.source, "error": r.error} for r in report.failed]
        job.total = job.total or report.total_chunks
        job.status = "done"
    except Exception as e:  # surface to client
        job.error = str(e)
        job.status = "error"
    finally:
        shutil.rmtree(job.dir / "uploads", ignore_errors=True)
        shutil.rmtree(job.dir / "work", ignore_errors=True)


def submit(job: Job, inputs: list[Path], cfg: SplitConfig) -> None:
    _executor.submit(_run, job, inputs, cfg)
