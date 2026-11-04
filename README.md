# Video & Audio Splitter

Splits video/audio files (or zips of them) into fixed-length chunks and returns one zip.

- **Video** → chunks end at the real source length (`45s @ 30s → 30s + 15s`).
- **Audio** → every chunk is exactly the selected length; the final chunk is padded with silence (`45s @ 30s → 30s + 15s audio + 15s silence`).
- Audio is written as WAV by default (lossless, ideal for Mel-spectrograms).

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 20.19+ or 22.12+ |
| FFmpeg + ffprobe | on `PATH` (`ffmpeg -version`) |

Windows FFmpeg install: `winget install Gyan.FFmpeg`, then reopen the terminal.

## 1. Run the backend (FastAPI + FFmpeg)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

If PowerShell blocks the activation script:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Check it is alive:

- <http://127.0.0.1:8000/health> → `{"status":"ok"}`
- <http://127.0.0.1:8000/docs> → interactive API docs

## 2. Run the frontend (React + Vite)

Open a **second** terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to `http://127.0.0.1:8000`, so no `.env` file or CORS setup is needed.

## Production build

```powershell
cd frontend
npm run build          # outputs frontend/dist
npm run preview        # local preview of the build
```

Serve `frontend/dist` from any static host and reverse-proxy `/api` to the FastAPI server (or set `VITE_API_URL=http://your-api-host:8000` before building).

## API

```text
POST /api/split                  multipart: files[], duration, audio_format, accurate_video
GET  /api/jobs/{job_id}          progress: status, done, total, current, failed
GET  /api/jobs/{job_id}/download result zip (when status == "done")
GET  /health
```

Output layout inside the returned zip:

```text
clip/clip_001.mp4
clip/clip_002.mp4
speech/speech_001.wav
speech/speech_002.wav
```

## CLI / notebook (same core)

```powershell
cd backend
python -m media_splitter.cli uploads -d 30 -o split_output.zip
```

Or open `backend/split_media.ipynb`.

## Notes

- Jobs live in memory and are deleted after 1 hour (single-process server). Good for a personal app; use Redis/a task queue if you scale to multiple workers.
- `accurate_video=true` re-encodes to H.264/AAC for frame-exact cuts. Set it to `false` for stream-copy cuts that are much faster but snap to keyframes.
- WebM/AVI/FLV/WMV sources are re-encoded to `.mp4` when exact cuts are enabled (H.264/AAC cannot be stored in those containers).
