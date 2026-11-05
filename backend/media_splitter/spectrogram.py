"""Mel spectrograms in plain NumPy, matching torchaudio.transforms.MelSpectrogram
(Hann window, center=True, reflect padding, HTK mel scale, norm=None) followed by
AmplitudeToDB(stype="power", top_db). No torch needed on the server."""
from __future__ import annotations

import subprocess
from pathlib import Path

import numpy as np
from matplotlib.image import imsave

from .models import MelConfig


def load_mono(path: Path, sample_rate: int, n_samples: int) -> np.ndarray:
    """Decode with ffmpeg to mono float32 at `sample_rate`, forced to exactly n_samples."""
    res = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-vn",
         "-ac", "1", "-ar", str(sample_rate), "-f", "f32le", "-"],
        capture_output=True,
    )
    if res.returncode != 0:
        raise RuntimeError(res.stderr.decode(errors="replace").strip()[-300:] or "ffmpeg decode failed")
    x = np.frombuffer(res.stdout, dtype="<f4").astype(np.float64)
    # Lossy codecs and resampling can drift by a few samples; keep every image the same width.
    if len(x) < n_samples:
        x = np.pad(x, (0, n_samples - len(x)))
    return x[:n_samples]


def _hz_to_mel(f):
    return 2595.0 * np.log10(1.0 + f / 700.0)


def _mel_to_hz(m):
    return 700.0 * (10.0 ** (m / 2595.0) - 1.0)


def mel_filterbank(cfg: MelConfig) -> np.ndarray:
    """(n_freqs, n_mels) triangular filters, same construction as torchaudio.functional.melscale_fbanks."""
    n_freqs = cfg.n_fft // 2 + 1
    freqs = np.linspace(0, cfg.sample_rate // 2, n_freqs)
    f_pts = _mel_to_hz(np.linspace(_hz_to_mel(cfg.f_min), _hz_to_mel(cfg.f_max), cfg.n_mels + 2))
    f_diff = np.diff(f_pts)
    slopes = f_pts[None, :] - freqs[:, None]
    down = -slopes[:, :-2] / f_diff[:-1]
    up = slopes[:, 2:] / f_diff[1:]
    return np.maximum(0.0, np.minimum(down, up))


def mel_spectrogram_db(x: np.ndarray, cfg: MelConfig) -> np.ndarray:
    """Return (n_mels, n_frames) in dB, clipped to `top_db` below the clip's peak."""
    win = np.hanning(cfg.win_length + 1)[:-1]  # periodic Hann, like torch.hann_window
    if cfg.win_length < cfg.n_fft:
        left = (cfg.n_fft - cfg.win_length) // 2
        win = np.pad(win, (left, cfg.n_fft - cfg.win_length - left))

    x = np.pad(x, cfg.n_fft // 2, mode="reflect")  # center=True
    n_frames = 1 + (len(x) - cfg.n_fft) // cfg.hop_length
    idx = np.arange(cfg.n_fft)[None, :] + cfg.hop_length * np.arange(n_frames)[:, None]
    spec = np.abs(np.fft.rfft(x[idx] * win, axis=1)) ** cfg.power   # (frames, freqs)

    mel = mel_filterbank(cfg).T @ spec.T                             # (n_mels, frames)
    db = 10.0 * np.log10(np.maximum(mel, 1e-10))
    return np.maximum(db, db.max() - cfg.top_db)


def render_mel_png(audio_path: Path, png_path: Path, chunk_seconds: float, cfg: MelConfig) -> None:
    """One pixel per frame and per mel bin, low frequencies at the bottom.

    The image spans the whole clip (`chunk_seconds`), so padded silence shows up as
    the dark tail of the image rather than being cropped away.
    """
    n_samples = int(round(chunk_seconds * cfg.sample_rate))
    db = mel_spectrogram_db(load_mono(audio_path, cfg.sample_rate, n_samples), cfg)
    imsave(str(png_path), db, cmap="magma", origin="lower", vmin=db.max() - cfg.top_db, vmax=db.max())
