import { AUDIO_FORMATS, DURATION_PRESETS } from "../data/constants";

export default function SettingsPanel({ duration, setDuration, audioFormat, setAudioFormat, accurateVideo, setAccurateVideo, disabled }) {
  return (
    <fieldset
      disabled={disabled}
      className="space-y-6 rounded-2xl border border-edge bg-card/70 p-5 backdrop-blur transition-opacity duration-300 disabled:opacity-60 sm:p-6"
    >
      <div>
        <p className="mb-3 flex items-center gap-2 font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-flame to-gold" />
          Clip length
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {DURATION_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={duration === s}
              onClick={() => setDuration(s)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                duration === s
                  ? "border-gold/60 bg-gradient-to-r from-flame to-gold text-night shadow-[0_0_26px_-8px_rgba(255,201,74,0.75)]"
                  : "border-edge bg-coal/60 text-cream hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold"
              }`}
            >
              {s}s
            </button>
          ))}
          <label className="ml-1 flex items-center gap-2 text-sm text-ash">
            Custom
            <input
              type="number"
              min={1}
              max={3600}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-20 rounded-xl border border-edge bg-night/60 px-3 py-2 text-cream transition-colors duration-200 focus:border-gold/60 focus:outline-none"
            />
            seconds
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-bold">Audio clip format</span>
          <select
            value={audioFormat}
            onChange={(e) => setAudioFormat(e.target.value)}
            className="w-full rounded-xl border border-edge bg-night/60 px-3 py-2.5 text-cream transition-colors duration-200 focus:border-gold/60 focus:outline-none"
          >
            {AUDIO_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-edge/70 bg-coal/40 p-3 text-sm transition-colors duration-200 hover:border-gold/30">
          <input
            type="checkbox"
            checked={accurateVideo}
            onChange={(e) => setAccurateVideo(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded accent-ember"
          />
          <span>
            <span className="block font-bold">Exact video cuts</span>
            <span className="text-ash">Re-encodes so clips are the exact length. Turn off for faster, approximate cuts.</span>
          </span>
        </label>
      </div>
    </fieldset>
  );
}
