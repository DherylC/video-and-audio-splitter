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
  { value: "mp3", label: "MP3 (compressed)" },
];
// Lossy bitrates in kbps. The slider steps by 64, so these are exactly the stops.
export const AUDIO_BITRATES = [64, 128, 192, 256, 320];
export const LOSSLESS_FORMATS = ["wav", "flac"];
export const MAX_STRIP_CLIPS = 9999;

// Speech defaults: 16 kHz audio, 25 ms window, 10 ms hop, 80 mel bins.
export const MEL_DEFAULTS = {
  sampleRate: 16000,
  nFft: 400,
  winLength: 400,
  hopLength: 160,
  nMels: 80,
  fMin: 0,
  fMax: 8000,
  power: 2,
};
export const MEL_FIELDS = [
  {
    key: "sampleRate",
    label: "Sample rate (Hz)",
    hint: "Clips are resampled to this",
  },
  { key: "nFft", label: "n_fft", hint: "400 = 25 ms window at 16 kHz" },
  { key: "winLength", label: "win_length", hint: "Usually equal to n_fft" },
  { key: "hopLength", label: "hop_length", hint: "160 = 10 ms frame shift" },
  { key: "nMels", label: "n_mels", hint: "Mel bins (image height)" },
  { key: "fMin", label: "f_min (Hz)", hint: "Lowest frequency kept" },
  { key: "fMax", label: "f_max (Hz)", hint: "At most half the sample rate" },
  { key: "power", label: "power", hint: "2 = power spectrogram" },
];
