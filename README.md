# Video & Audio Splitter

Splits video/audio files (or zips of them) into fixed-length chunks and returns one zip.

- **Video → video** → chunks keep the real source length (`45s @ 30s → 30s + 15s`).
- **Video → audio** → extracts the soundtrack into padded audio clips (`45s @ 30s → 30s + 15s audio + 15s silence`). Optional Mel spectrogram PNGs are generated too.
- **Audio** → every chunk is exactly the selected length; the final chunk is padded with silence.
- **Format + bitrate** → WAV/FLAC (lossless) or MP3 at 64/128/192/256/320 kbps.
- **Clip length** → presets or a custom value (5–3600 s; custom values apply on Enter or blur).

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 20.19+ or 22.12+ |
| FFmpeg + ffprobe | on `PATH` (`ffmpeg -version`) |

Windows FFmpeg install:

```powershell
winget install Gyan.FFmpeg
```

Reopen the terminal afterwards so `PATH` is refreshed.

## Install

From the project root:

```powershell
# Backend: creates backend/.venv and installs FastAPI, uvicorn, NumPy, matplotlib, ...
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

# Frontend: React 19, Vite 8, Tailwind 4, lucide-react
cd ..\frontend
npm install
```

`numpy` and `matplotlib` are required for Mel spectrograms. Both are in
`backend/requirements.txt`, so the command above installs them. If a split fails
with `No module named 'numpy'`, the backend is running with a different interpreter
or the venv was created before those packages were added — activate the venv and
re-run `pip install -r requirements.txt`.

If PowerShell blocks the activation script:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Run

### 1. Backend (FastAPI + FFmpeg)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

Check it is alive:

- <http://127.0.0.1:8000/health> → `{"status":"ok"}`
- <http://127.0.0.1:8000/docs> → interactive API docs

### 2. Frontend (React + Vite)

Open a **second** terminal:

```powershell
cd frontend
npm run dev
```

Open <http://localhost:5173> (Vite uses the next free port if 5173 is taken).
`vite.config.js` proxies `/api` to `http://127.0.0.1:8000`, so no `.env` file or
CORS setup is needed for development.

## Output format and bitrate

| Selection | Encoding | Approx. size |
|---|---|---|
| WAV | 16-bit PCM, lossless | ~10 MB/min (44.1 kHz stereo) |
| FLAC | Lossless compressed | ~4–6 MB/min typical |
| MP3 64 kbps | Lossy | ~0.5 MB/min |
| MP3 128 kbps | Lossy | ~1 MB/min |
| MP3 192 kbps | Lossy | ~1.4 MB/min |
| MP3 256 kbps | Lossy | ~1.9 MB/min |
| MP3 320 kbps | Lossy | ~2.4 MB/min |

- The slider snaps to the five MP3 stops; the **Lossless** switch disables it and
  switches the output to the last lossless format used (FLAC by default), or back
  to MP3 when turned off.
- `audio_bitrate` is ignored for WAV/FLAC.
- When videos are split **as video**, the bitrate control does not affect the AAC
  audio track inside those files.
- Mel spectrograms are rendered from the produced audio clips, so they work for
  audio uploads and for videos split with **Extract audio**.

## Production build

```powershell
cd frontend
npm run build          # outputs frontend/dist
npm run preview        # local preview of the build
```

Serve `frontend/dist` from any static host and reverse-proxy `/api` to the FastAPI
server (or set `VITE_API_URL=http://your-api-host:8000` before building).

## API

```text
POST /api/split
  multipart/form-data:
    files[]            one or more media files and/or zips (repeatable)
    duration           clip length in seconds
    audio_format       wav | flac | mp3 | m4a | ogg   (default: wav)
    audio_bitrate      64 | 128 | 192 | 256 | 320     (default: 192, lossy only)
    video_output       video | audio                  (default: video)
    accurate_video     true | false                   (default: true)
    mel                true | false                   (default: false)
    mel_sample_rate    default 16000
    mel_n_fft          default 400
    mel_win_length     default 400
    mel_hop_length     default 160
    mel_n_mels         default 80
    mel_f_min          default 0
    mel_f_max          default 8000
    mel_power          default 2
  returns: { "job_id": "..." }

GET  /api/jobs/{job_id}           progress: status, done, total, current, failed,
                                  mel_done, mel_total
GET  /api/jobs/{job_id}/download  result zip (when status == "done")
GET  /health
```

The UI exposes WAV, FLAC and MP3. The API also accepts `m4a` and `ogg`.
When calling the API or CLI, `video_output` applies to every video in the batch,
including videos found inside zips. In the UI, the Video output choice appears
when at least one video file is queued directly.

Output layout inside the returned zip:

```text
# keep as video
clip/clip_001.mp4
clip/clip_002.mp4

# extract audio + Mel spectrogram
clip/clip_001.mp3
clip/clip_001.png
clip/clip_002.mp3
clip/clip_002.png

# audio upload
speech/speech_001.wav
speech/speech_002.wav
```

## CLI / notebook (same core)

```powershell
cd backend
python -m media_splitter.cli uploads -d 30 -o split_output.zip
```

Useful flags:

```text
--audio-format {wav,flac,mp3,m4a,ogg}   default wav
--audio-bitrate {64,128,192,256,320}    default 192 (lossy formats only)
--video-output {video,audio}            default video
--fast-video                            stream copy instead of exact re-encode
--mel                                   also write Mel spectrogram PNGs
```

Or open `backend/split_media.ipynb`.

## Notes

- Jobs live in memory and are deleted after 1 hour (single-process server). Good
  for a personal app; use Redis/a task queue if you scale to multiple workers.
- `accurate_video=true` re-encodes to H.264/AAC for frame-exact cuts. Set it to
  `false` for stream-copy cuts that are much faster but snap to keyframes.
- WebM/AVI/FLV/WMV sources are re-encoded to `.mp4` when exact cuts are enabled
  (H.264/AAC cannot be stored in those containers).
- Zips are extracted recursively (up to 5 levels) before splitting, and folder
  structure is preserved in the output zip.
