import { MEL_FIELDS } from "../data/constants";

export default function MelOptions({ mel }) {
  const { useDefaults, setUseDefaults, params, setParam, resetParams, error } = mel;
  const mode = (isDefault, label) => (
    <button
      type="button"
      aria-pressed={useDefaults === isDefault}
      onClick={() => setUseDefaults(isDefault)}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
        useDefaults === isDefault
          ? "border-gold/60 bg-gradient-to-r from-flame to-gold text-night"
          : "border-edge bg-coal/60 text-cream hover:border-gold/40 hover:text-gold"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4 rounded-xl border border-edge/70 bg-coal/40 p-4">
      <div>
        <p className="mb-1 font-bold">Mel spectrogram parameters</p>
        <p className="text-sm text-ash">
          Each audio clip gets a PNG with the same name. The image covers the whole clip, so padded silence shows as a dark tail. Video clips are not converted.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mode(true, "Default (speech)")}
        {mode(false, "Custom")}
        {!useDefaults && (
          <button type="button" onClick={resetParams} className="ml-1 text-sm text-ash underline-offset-4 hover:text-gold hover:underline">
            Reset to default
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MEL_FIELDS.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="mb-1 block font-medium">{f.label}</span>
            <input
              type="number"
              value={Number.isFinite(params[f.key]) ? params[f.key] : ""}
              readOnly={useDefaults}
              onChange={(e) => setParam(f.key, e.target.value === "" ? NaN : Number(e.target.value))}
              className={`w-full rounded-xl border border-edge bg-night/60 px-3 py-2 text-cream focus:border-gold/60 focus:outline-none ${useDefaults ? "opacity-60" : ""}`}
            />
            <span className="mt-1 block text-xs text-ash">{f.hint}</span>
          </label>
        ))}
      </div>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
