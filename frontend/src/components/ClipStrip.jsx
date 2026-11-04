import { MAX_STRIP_CLIPS } from "../data/constants";
import { planClips } from "../lib/media";

const HATCH = "repeating-linear-gradient(45deg, rgba(255, 201, 74, 0.55) 0 3px, transparent 3px 6px)";

// One cell per output clip. Flame gradient = real media, hatched gold = silence padding.
export default function ClipStrip({ duration, chunk, kind }) {
  const clips = planClips(duration, chunk, kind);
  if (clips.length > MAX_STRIP_CLIPS) {
    return <p className="text-sm text-ash">{clips.length} clips</p>;
  }
  const last = clips[clips.length - 1];
  return (
    <div>
      <div className="flex gap-1" aria-hidden="true">
        {clips.map((c, i) => (
          <div key={i} className="flex h-2 flex-1 overflow-hidden rounded-full bg-edge/70">
            <div
              className="bg-gradient-to-r from-flame to-ember"
              style={{ width: `${(c.len / chunk) * 100}%` }}
            />
            {c.pad > 0 && <div style={{ width: `${(c.pad / chunk) * 100}%`, background: HATCH }} />}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-ash">
        {clips.length} {clips.length === 1 ? "clip" : "clips"}
        {last && last.len < chunk - 0.05 &&
          (kind === "audio"
            ? `, last one padded with ${Math.round(last.pad)}s of silence`
            : `, last one is ${Math.round(last.len)}s`)}
      </p>
    </div>
  );
}
