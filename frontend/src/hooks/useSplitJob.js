import { useCallback, useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "";

const initial = {
  phase: "idle", // idle | uploading | processing | done | error
  uploadPct: 0,
  done: 0,
  total: 0,
  current: "",
  failed: [],
  error: null,
  jobId: null,
};

export function useSplitJob() {
  const [state, setState] = useState(initial);
  const pollRef = useRef(null);
  const xhrRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  const fail = useCallback((message) => {
    stopPolling();
    setState((s) => ({ ...s, phase: "error", error: message }));
  }, []);

  const poll = useCallback(
    (jobId) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API}/api/jobs/${jobId}`);
          if (!res.ok) throw new Error(`Status check failed (${res.status})`);
          const j = await res.json();
          if (j.status === "done") {
            stopPolling();
            setState((s) => ({ ...s, phase: "done", done: j.done, total: j.total, failed: j.failed }));
          } else if (j.status === "error") {
            fail(j.error || "Processing failed");
          } else {
            setState((s) => ({ ...s, phase: "processing", done: j.done, total: j.total, current: j.current }));
          }
        } catch (e) {
          fail(e.message);
        }
      }, 1000);
    },
    [fail]
  );

  // XHR instead of fetch: fetch cannot report upload progress.
  const start = useCallback(
    (files, duration, { audioFormat = "wav", accurateVideo = true } = {}) => {
      stopPolling();
      setState({ ...initial, phase: "uploading" });

      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      form.append("duration", String(duration));
      form.append("audio_format", audioFormat);
      form.append("accurate_video", String(accurateVideo));

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", `${API}/api/split`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setState((s) => ({ ...s, uploadPct: Math.round((e.loaded / e.total) * 100) }));
      };
      xhr.onload = () => {
        let body = {};
        try { body = JSON.parse(xhr.responseText); } catch {}
        if (xhr.status >= 200 && xhr.status < 300) {
          setState((s) => ({ ...s, phase: "processing", jobId: body.job_id }));
          poll(body.job_id);
        } else {
          fail(typeof body.detail === "string" ? body.detail : `Upload failed (${xhr.status})`);
        }
      };
      xhr.onerror = () => fail("Network error during upload");
      xhr.send(form);
    },
    [poll, fail]
  );

  const reset = useCallback(() => {
    stopPolling();
    xhrRef.current?.abort();
    setState(initial);
  }, []);

  useEffect(() => () => { stopPolling(); xhrRef.current?.abort(); }, []);

  const downloadUrl = state.phase === "done" && state.jobId ? `${API}/api/jobs/${state.jobId}/download` : null;

  return { ...state, start, reset, downloadUrl };
}
