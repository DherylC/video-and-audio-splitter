from __future__ import annotations

import shutil
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from media_splitter import AUDIO_BITRATES, MelConfig, SplitConfig
from media_splitter.probe import require_ffmpeg

from . import jobs


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Fail fast at boot with a clear message instead of on the first request.
    require_ffmpeg()
    yield


app = FastAPI(title="Media Splitter API", lifespan=lifespan)

# Needed if the React app calls the API cross-origin (no Vite proxy). The regex
# also covers Vite's fallback ports (5174, 5175, ...) and 127.0.0.1.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_AUDIO_FORMATS = {"wav", "mp3", "flac", "m4a", "ogg"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/split")
def start_split(
    files: List[UploadFile] = File(...),
    duration: float = Form(...),
    audio_format: str = Form("wav"),
    audio_bitrate: int = Form(192),
    accurate_video: bool = Form(True),
    video_output: str = Form("video"),
    mel: bool = Form(False),
    mel_sample_rate: int = Form(16000),
    mel_n_fft: int = Form(400),
    mel_win_length: int = Form(400),
    mel_hop_length: int = Form(160),
    mel_n_mels: int = Form(80),
    mel_f_min: float = Form(0.0),
    mel_f_max: float = Form(8000.0),
    mel_power: float = Form(2.0),
):
    if not 1 <= duration <= 3600:
        raise HTTPException(400, "duration must be between 1 and 3600 seconds")
    if audio_format not in ALLOWED_AUDIO_FORMATS:
        raise HTTPException(400, f"audio_format must be one of {sorted(ALLOWED_AUDIO_FORMATS)}")
    if audio_bitrate not in AUDIO_BITRATES:
        raise HTTPException(400, f"audio_bitrate must be one of {list(AUDIO_BITRATES)}")
    if video_output not in {"video", "audio"}:
        raise HTTPException(400, "video_output must be 'video' or 'audio'")

    mel_cfg = None
    if mel:
        try:
            mel_cfg = MelConfig(
                sample_rate=mel_sample_rate, n_fft=mel_n_fft, win_length=mel_win_length,
                hop_length=mel_hop_length, n_mels=mel_n_mels, f_min=mel_f_min, f_max=mel_f_max, power=mel_power,
            )
        except ValueError as e:
            raise HTTPException(400, str(e))

    job = jobs.create_job()
    saved: list[Path] = []
    for i, f in enumerate(files):
        name = Path(f.filename or f"upload_{i}").name  # strip any path components
        dest = job.dir / "uploads" / name
        if dest.exists():
            dest = job.dir / "uploads" / f"{i}_{name}"
        with open(dest, "wb") as out:
            shutil.copyfileobj(f.file, out)
        saved.append(dest)

    cfg = SplitConfig(
        duration,
        audio_format=audio_format,
        audio_bitrate=audio_bitrate,
        accurate_video=accurate_video,
        video_output=video_output,
        mel=mel_cfg,
    )
    jobs.submit(job, saved, cfg)
    return {"job_id": job.id}


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(404, "job not found or expired")
    return job.public()


@app.get("/api/jobs/{job_id}/download")
def job_download(job_id: str):
    job = jobs.get_job(job_id)
    if not job or job.status != "done" or not job.zip_path:
        raise HTTPException(404, "result not ready")
    return FileResponse(job.zip_path, media_type="application/zip", filename="split_output.zip")
