import { formatBytes, formatTime } from "../lib/media";
import ClipStrip from "./ClipStrip";

export default function FileRow({ item, index = 0, chunk, clips, stripKind, onRemove, locked }) {
  const { file, kind, duration } = item;
  return (
    <li
      className="animate-fade-up group rounded-2xl border border-edge bg-card/70 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-[0_18px_44px_-30px_rgba(255,122,26,0.7)]"
      style={{ animationDelay: `${Math.min(index * 60, 360)}ms` }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="min-w-0 truncate font-semibold">{file.name}</p>
        <button
          onClick={() => onRemove(item.id)}
          disabled={locked}
          className="shrink-0 rounded-full border border-transparent px-3 py-1 text-sm text-ash transition-colors duration-200 hover:border-danger/30 hover:bg-danger/10 hover:text-danger disabled:opacity-40"
        >
          Remove
        </button>
      </div>
      <p className="mb-3 text-sm text-ash">
        {kind === "zip" ? "Zip archive" : kind === "video" ? "Video" : "Audio"}, {formatBytes(file.size)}
        {duration ? `, ${formatTime(duration)}` : ""}
        {clips != null ? `, ${clips} ${clips === 1 ? "clip" : "clips"}` : ""}
      </p>
      {kind === "zip" ? (
        <p className="text-sm text-ash">Clip count is shown after splitting.</p>
      ) : duration ? (
        <ClipStrip duration={duration} chunk={chunk} kind={stripKind ?? kind} />
      ) : (
        <p className="text-sm text-ash">Reading duration…</p>
      )}
    </li>
  );
}
