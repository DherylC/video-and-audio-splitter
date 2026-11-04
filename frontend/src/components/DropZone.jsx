import { useState } from "react";
import { ACCEPT } from "../data/constants";

export default function DropZone({ onFiles, disabled, rejected }) {
  const [over, setOver] = useState(false);

  return (
    <div>
      <label
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!disabled) onFiles(e.dataTransfer.files);
        }}
        className={`group flex cursor-pointer flex-col items-center gap-3 rounded-3xl border border-dashed px-6 py-12 text-center transition-all duration-300 focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-gold
          ${over
            ? "border-gold/70 bg-gradient-to-b from-flame/10 to-gold/5 shadow-[0_0_60px_-16px_rgba(255,201,74,0.55)]"
            : "border-edge bg-card/60 backdrop-blur hover:-translate-y-1 hover:border-gold/40 hover:bg-card/80 hover:shadow-[0_24px_60px_-32px_rgba(255,122,26,0.55)]"}
          ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-edge bg-gradient-to-br from-flame/25 to-gold/10 text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M12 16V4" />
            <path d="m7 9 5-5 5 5" />
            <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
          </svg>
        </span>
        <span className="text-lg font-bold">Drop videos, audio, or a zip here</span>
        <span className="max-w-sm text-sm leading-relaxed text-ash">
          or click to choose files. Zips are searched for media, folders included.
        </span>
        <input
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
        />
      </label>
      {rejected.length > 0 && (
        <p role="alert" className="mt-3 animate-fade-in rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          Skipped unsupported {rejected.length === 1 ? "file" : "files"}: {rejected.join(", ")}
        </p>
      )}
    </div>
  );
}
