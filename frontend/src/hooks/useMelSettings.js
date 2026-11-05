import { useCallback, useState } from "react";
import { MEL_DEFAULTS } from "../data/constants";

// Mirrors the server-side checks so the Split button can be disabled early.
export function validateMel(p) {
  if (Object.values(p).some((v) => !Number.isFinite(v))) return "Fill in every parameter.";
  const ints = ["sampleRate", "nFft", "winLength", "hopLength", "nMels"];
  if (ints.some((k) => !Number.isInteger(p[k]))) return "Sample rate, n_fft, win_length, hop_length and n_mels must be whole numbers.";
  if (p.sampleRate < 8000 || p.sampleRate > 48000) return "Sample rate must be between 8000 and 48000.";
  if (p.nFft < 16 || p.nFft > 8192) return "n_fft must be between 16 and 8192.";
  if (p.winLength < 1 || p.winLength > p.nFft) return "win_length must be between 1 and n_fft.";
  if (p.hopLength < 1 || p.hopLength > p.nFft) return "hop_length must be between 1 and n_fft.";
  if (p.nMels < 1 || p.nMels > 512) return "n_mels must be between 1 and 512.";
  if (!(p.fMin >= 0 && p.fMin < p.fMax && p.fMax <= p.sampleRate / 2)) return "Need 0 ≤ f_min < f_max ≤ sample rate / 2.";
  if (p.power <= 0) return "power must be greater than 0.";
  return null;
}

export function useMelSettings() {
  const [enabled, setEnabled] = useState(false);
  const [useDefaults, setUseDefaults] = useState(true);
  const [params, setParams] = useState(MEL_DEFAULTS);

  const setParam = useCallback((key, value) => setParams((p) => ({ ...p, [key]: value })), []);
  const resetParams = useCallback(() => setParams(MEL_DEFAULTS), []);

  const active = useDefaults ? MEL_DEFAULTS : params;
  return {
    enabled, setEnabled, useDefaults, setUseDefaults,
    params: active, setParam, resetParams,
    error: enabled && !useDefaults ? validateMel(params) : null,
    payload: enabled ? active : null, // what gets sent to the API
  };
}
