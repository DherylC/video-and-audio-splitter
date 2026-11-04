export const AUDIO_EXTS = [
  ".wav",
  ".mp3",
  ".m4a",
  ".aac",
  ".flac",
  ".ogg",
  ".opus",
  ".wma",
];
export const VIDEO_EXTS = [
  ".mp4",
  ".mov",
  ".mkv",
  ".avi",
  ".webm",
  ".m4v",
  ".flv",
  ".wmv",
];
export const ACCEPT = [...AUDIO_EXTS, ...VIDEO_EXTS, ".zip"].join(",");

export const DURATION_PRESETS = [10, 15, 20, 30, 60];
export const AUDIO_FORMATS = [
  { value: "wav", label: "WAV (lossless)" },
  { value: "flac", label: "FLAC (lossless, smaller)" },
  { value: "mp3", label: "MP3" },
];
export const MAX_STRIP_CLIPS = 48;
