import { AUDIO_EXTS, VIDEO_EXTS } from "../data/constants";

export function kindOf(file) {
  const name = file.name.toLowerCase();
  const ext = name.slice(name.lastIndexOf("."));
  if (ext === ".zip") return "zip";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (AUDIO_EXTS.includes(ext)) return "audio";
  return null;
}

export function formatBytes(n) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function formatTime(sec) {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Reads duration in the browser so the clip preview needs no server round trip.
export function probeDuration(file, kind) {
  return new Promise((resolve) => {
    const el = document.createElement(kind === "video" ? "video" : "audio");
    const url = URL.createObjectURL(file);
    const done = (v) => { URL.revokeObjectURL(url); resolve(v); };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null);
    el.onerror = () => done(null);
    el.src = url;
  });
}

// Mirrors the backend: audio always rounds up (and pads), video drops
// remainders under 0.05s and keeps the real length of its final clip.
export function countClips(duration, chunk, kind) {
  const safeDuration = Number(duration);
  const safeChunk = Number(chunk);
  // A zero/NaN/Infinity chunk used to make the count Infinity and crash
  // Array.from with "Invalid array length".
  if (!Number.isFinite(safeDuration) || !Number.isFinite(safeChunk)) return 0;
  if (safeDuration <= 0 || safeChunk <= 0) return 0;
  if (kind === "audio") return Math.max(1, Math.ceil(safeDuration / safeChunk));
  if (safeDuration <= 0.05) return 0;
  return Math.max(1, Math.ceil((safeDuration - 0.05) / safeChunk));
}

// Clip count for a queued item, taking "extract audio from video" into account.
// Zip archives only reveal their contents after splitting.
export function clipsForItem(item, chunk, videoOutput) {
  if (item.kind === "zip" || !item.duration) return null;
  const kind = item.kind === "video" && videoOutput === "audio" ? "audio" : item.kind;
  return countClips(item.duration, chunk, kind);
}

export function planClips(duration, chunk, kind) {
  const count = countClips(duration, chunk, kind);
  if (count <= 0) return [];

  const safeDuration = Number(duration);
  const safeChunk = Number(chunk);
  return Array.from({ length: count }, (_, i) => {
    const len = Math.min(safeChunk, safeDuration - i * safeChunk);
    return { len, pad: kind === "audio" ? safeChunk - len : 0 };
  });
}
