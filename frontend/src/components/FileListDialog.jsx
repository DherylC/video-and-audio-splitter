import { useEffect, useRef } from "react";
import { AudioLines, FileArchive, Film, X } from "lucide-react";
import { clipsForItem, formatBytes, formatTime } from "../lib/media";
import ClipStrip from "./ClipStrip";
import SortControl from "./SortControl";

const KIND_META = {
  audio: { label: "Audio", icon: AudioLines },
  video: { label: "Video", icon: Film },
  zip: { label: "Zip archive", icon: FileArchive },
};

export default function FileListDialog({
  items,
  chunk,
  videoOutput,
  locked,
  onRemove,
  onClose,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
}) {
  const closeRef = useRef(null);
  const totalClips = items.reduce((sum, item) => sum + (clipsForItem(item, chunk, videoOutput) ?? 0), 0);
  const pending = items.some((item) => item.kind !== "zip" && !item.duration);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-night/75 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="files-title"
        className="animate-pop flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-edge bg-coal shadow-[0_40px_120px_-40px_rgba(255,75,43,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden="true" className="h-1 shrink-0 bg-linear-to-r from-flame via-ember to-gold" />

        <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
          <div>
            <h2 id="files-title" className="text-xl font-extrabold tracking-tight">All files</h2>
            <p className="mt-1 text-sm text-ash">
              {items.length} {items.length === 1 ? "file" : "files"}
              <span className="px-1.5 text-edge">·</span>
              {totalClips}{pending ? "+" : ""} clips total
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close file list"
            title="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge bg-card text-cream transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 border-y border-edge/70 px-5 py-3 sm:px-6">
          <SortControl
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
          />
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-edge/50 overflow-y-auto px-2 py-2 sm:px-3">
          {items.map((item) => {
            const meta = KIND_META[item.kind] ?? KIND_META.audio;
            const Icon = meta.icon;
            const clips = clipsForItem(item, chunk, videoOutput);
            // Videos set to "Extract audio" produce padded audio clips, so the
            // strip must reflect the audio pipeline rather than the video one.
            const stripKind = item.kind === "video" && videoOutput === "audio" ? "audio" : item.kind;
            return (
              <li key={item.id} className="rounded-xl px-2 py-3 transition-colors duration-200 hover:bg-card/60">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-edge bg-night/60 text-gold">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" title={item.file.name}>{item.file.name}</p>
                    <p className="mt-0.5 text-xs text-ash">
                      {meta.label}
                      <span className="px-1 text-edge">·</span>
                      {formatBytes(item.file.size)}
                      {item.duration ? (
                        <>
                          <span className="px-1 text-edge">·</span>
                          {formatTime(item.duration)}
                        </>
                      ) : null}
                    </p>
                  </div>

                  {clips === null && (
                    <span className="shrink-0 rounded-full border border-edge bg-night/60 px-2.5 py-0.5 text-[11px] font-bold text-ash">
                      {item.kind === "zip" ? "Zip" : "Reading…"}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    disabled={locked}
                    aria-label={`Remove ${item.file.name}`}
                    title="Remove"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ash transition-colors duration-200 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 pl-12">
                  {item.kind === "zip" ? (
                    <p className="text-xs text-ash">Clip count is shown after splitting.</p>
                  ) : item.duration ? (
                    <ClipStrip duration={item.duration} chunk={chunk} kind={stripKind} />
                  ) : (
                    <p className="text-xs text-ash">Reading duration…</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
