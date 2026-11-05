import { useState } from "react";
import {
  AudioLines,
  AudioWaveform,
  Check,
  ChevronDown,
  Clock3,
  Film,
  Gauge,
  Scissors,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { AUDIO_BITRATES, AUDIO_FORMATS, DURATION_PRESETS, LOSSLESS_FORMATS } from "../data/constants";
import MelOptions from "./MelOptions";

const MIN_DURATION = 5;
const MAX_DURATION = 3600;

function SettingCard({ icon: Icon, title, description, checked, onChange }) {
  return (
    <label
      className={`group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border p-3 text-sm transition-all duration-300 ${checked
        ? "border-gold/40 bg-linear-to-br from-flame/10 via-transparent to-gold/10 shadow-[0_14px_36px_-26px_rgba(255,201,74,0.9)]"
        : "border-edge/70 bg-coal/40 hover:border-gold/30 hover:bg-coal/60"
        }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-gold/60 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card ${checked
          ? "border-transparent bg-linear-to-br from-flame to-gold text-night shadow-[0_0_18px_-4px_rgba(255,201,74,0.85)]"
          : "border-edge bg-night/60 text-transparent group-hover:border-gold/40"
          }`}
      >
        {checked && <Check aria-hidden="true" className="h-3.5 w-3.5 animate-pop" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-bold">
          <Icon
            aria-hidden="true"
            className={`h-4 w-4 transition-colors duration-200 ${checked ? "text-gold" : "text-ash"}`}
          />
          {title}
        </span>
        <span className="mt-1 block leading-relaxed text-ash">{description}</span>
      </span>
    </label>
  );
}

export default function SettingsPanel({ duration, setDuration, audioFormat, setAudioFormat, audioBitrate, setAudioBitrate, accurateVideo, setAccurateVideo, hasVideo, videoOutput, setVideoOutput, disabled, mel }) {
  // Kept as a draft: the parent duration only changes on Enter or submit.
  const [customDuration, setCustomDuration] = useState(() => String(duration));
  const [durationWarning, setDurationWarning] = useState(false);
  // The toggle is derived from the format. Remember which lossless format to
  // return to when lossless is switched back on (FLAC keeps it compact).
  const [lastLosslessFormat, setLastLosslessFormat] = useState("flac");
  const lossless = LOSSLESS_FORMATS.includes(audioFormat);
  const bitrateMin = AUDIO_BITRATES[0];
  const bitrateMax = AUDIO_BITRATES[AUDIO_BITRATES.length - 1];
  const bitrateProgress = ((audioBitrate - bitrateMin) / (bitrateMax - bitrateMin)) * 100;

  const chooseFormat = (value) => {
    setAudioFormat(value);
    if (LOSSLESS_FORMATS.includes(value)) setLastLosslessFormat(value);
  };

  const toggleLossless = () => {
    setAudioFormat(lossless ? "mp3" : lastLosslessFormat);
  };

  const choosePreset = (seconds) => {
    setCustomDuration(String(seconds));
    setDurationWarning(false);
    setDuration(seconds);
  };

  const commitCustomDuration = () => {
    const parsed = Number(customDuration);
    if (customDuration.trim() === "" || !Number.isFinite(parsed)) {
      setCustomDuration(String(duration));
      setDurationWarning(false);
      return;
    }

    const belowMinimum = parsed < MIN_DURATION;
    const clamped = Math.min(MAX_DURATION, Math.max(MIN_DURATION, parsed));
    setCustomDuration(String(clamped));
    setDurationWarning(belowMinimum);
    setDuration(clamped);
  };

  return (
    <fieldset
      disabled={disabled}
      className="space-y-6 rounded-2xl border border-edge bg-card/70 p-5 backdrop-blur transition-opacity duration-300 disabled:opacity-60 sm:p-6"
    >

      <div>
        <p className="mb-3 flex items-center gap-2 font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-linear-to-r from-flame to-gold" />
          Clip length
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {DURATION_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={duration === s}
              onClick={() => choosePreset(s)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${duration === s
                ? "border-gold/60 bg-linear-to-r from-flame to-gold text-night shadow-[0_0_26px_-8px_rgba(255,201,74,0.75)]"
                : "border-edge bg-coal/60 text-cream hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold"
                }`}
            >
              {s}s
            </button>
          ))}
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              commitCustomDuration();
            }}
            className="ml-1"
          >
            <div
              className={`flex items-center gap-2 rounded-xl border bg-night/60 px-3 py-2 text-sm text-ash transition-all duration-200 ${durationWarning
                ? "border-gold/60 ring-2 ring-gold/20"
                : "border-edge hover:border-gold/30 focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/20"
                }`}
            >
              <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />
              <label htmlFor="custom-duration" className="cursor-pointer">Custom</label>
              <input
                id="custom-duration"
                type="number"
                min={MIN_DURATION}
                max={MAX_DURATION}
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  setDurationWarning(false);
                }}
                onBlur={commitCustomDuration}
                aria-invalid={durationWarning || undefined}
                aria-describedby={durationWarning ? "custom-duration-warning" : undefined}
                className="w-14 rounded-sm bg-transparent text-center font-semibold text-cream outline-none"
              />
              <span className="text-xs">sec</span>
            </div>
          </form>
        </div>
        {durationWarning && (
          <p
            id="custom-duration-warning"
            role="alert"
            className="mt-2 flex animate-fade-in items-center gap-1.5 text-xs font-medium text-gold"
          >
            <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            Minimum clip length is 5 seconds. The value was set to 5s.
          </p>
        )}
      </div>

      {hasVideo && (
        <div className="origin-top animate-reveal border-y border-edge py-6">
          <p className="mb-3  flex items-center gap-2 font-bold">
            <Film aria-hidden="true" className="h-4 w-4 text-gold" />
            Video output
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                value: "video",
                icon: Film,
                title: "Keep as video",
                description: "Split the video as-is, keeping the original frames.",
              },
              {
                value: "audio",
                icon: AudioLines,
                title: "Extract audio",
                description: "Turn the soundtrack into padded audio clips.",
              },
            ].map((option) => {
              const Icon = option.icon;
              const active = videoOutput === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setVideoOutput(option.value)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${active
                    ? "border-gold/50 bg-gradient-to-br from-flame/10 via-transparent to-gold/10 shadow-[0_14px_36px_-26px_rgba(255,201,74,0.9)]"
                    : "border-edge/70 bg-coal/40 hover:border-gold/30 hover:bg-coal/60"
                    }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`mt-0.5 h-4 w-4 shrink-0 transition-colors duration-200 ${active ? "text-gold" : "text-ash"}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-cream">{option.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ash">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div>
            <label htmlFor="audio-format" className="mb-3 flex items-center gap-2 font-bold">
              <AudioLines aria-hidden="true" className="h-4 w-4 text-gold" />
              Audio clip format
            </label>
            <div className="group relative">
              <select
                id="audio-format"
                value={audioFormat}
                onChange={(e) => chooseFormat(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-edge bg-night/60 py-2.5 pl-4 pr-10 text-cream transition-all duration-200 hover:border-gold/30 focus:border-gold/60 focus:outline-none focus:ring-2 focus:ring-gold/20"
              >
                {AUDIO_FORMATS.map((f) => (
                  <option key={f.value} value={f.value} className="bg-night text-cream">
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash transition-all duration-200 group-focus-within:rotate-180 group-focus-within:text-gold"
              />
            </div>
          </div>

          <div className="rounded-xl border border-edge/70 bg-coal/40 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-bold">
                <Gauge aria-hidden="true" className="h-4 w-4 text-gold" />
                Audio bitrate
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors duration-200 ${lossless
                  ? "border-gold/50 bg-gold/15 text-gold"
                  : "border-edge bg-night/60 text-cream"
                  }`}
              >
                {lossless ? "Lossless" : `${audioBitrate} kbps`}
              </span>
            </div>

            <div className="relative">
              <input
                type="range"
                min={bitrateMin}
                max={bitrateMax}
                step={AUDIO_BITRATES[1] - AUDIO_BITRATES[0]}
                value={audioBitrate}
                disabled={lossless}
                onChange={(e) => setAudioBitrate(Number(e.target.value))}
                aria-label="Audio bitrate"
                aria-valuetext={lossless ? "Lossless" : `${audioBitrate} kilobits per second`}
                className="bitrate-slider block w-full"
                style={{ "--bitrate-progress": `${bitrateProgress}%` }}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${lossless ? "opacity-40" : ""}`}
              >
                {AUDIO_BITRATES.map((rate) => {
                  const active = !lossless && audioBitrate === rate;
                  const percent = ((rate - bitrateMin) / (bitrateMax - bitrateMin)) * 100;
                  return (
                    <span
                      key={rate}
                      style={{ left: `${percent}%` }}
                      className={`absolute top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${active ? "scale-125 bg-gold shadow-[0_0_10px_rgba(255,201,74,0.95)]" : "bg-cream/30"}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="relative mx-2 mt-1 h-4">
              {AUDIO_BITRATES.map((rate) => {
                const active = !lossless && audioBitrate === rate;
                const percent = ((rate - bitrateMin) / (bitrateMax - bitrateMin)) * 100;
                return (
                  <button
                    key={rate}
                    type="button"
                    disabled={lossless}
                    aria-pressed={active}
                    aria-label={`${rate} kilobits per second`}
                    onClick={() => setAudioBitrate(rate)}
                    style={{ left: `${percent}%` }}
                    className={`absolute top-0 -translate-x-1/2 rounded px-1 text-[10px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed ${active ? "text-gold" : "text-ash hover:text-cream"}`}
                  >
                    {rate}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={lossless}
              aria-label="Lossless audio"
              title="Lossless keeps every sample and ignores the bitrate"
              onClick={toggleLossless}
              className={`mt-4 flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 ${lossless
                ? "border-gold/60 bg-gold/15 text-gold shadow-[0_0_22px_-10px_rgba(255,201,74,0.9)]"
                : "border-edge bg-night/60 text-ash hover:border-gold/40 hover:text-gold"
                }`}
            >
              Lossless
              <span
                aria-hidden="true"
                className={`relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200 ${lossless ? "bg-linear-to-r from-flame to-gold" : "bg-edge"
                  }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-night transition-all duration-200 ${lossless ? "left-3.5" : "left-0.5"
                    }`}
                />
              </span>
            </button>

            <p className="mt-3 text-[11px] leading-relaxed text-ash">
              {lossless
                ? "Full quality — bitrate is fixed by the lossless format."
                : "Lower is smaller, higher is clearer. Snaps to the nearest stop."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-gold" />
            More Settings
          </span>

          <SettingCard
            icon={Scissors}
            title="Exact video cuts"
            description="Re-encodes so clips are the exact length. Turn off for faster, approximate cuts."
            checked={accurateVideo}
            onChange={(e) => setAccurateVideo(e.target.checked)}
          />
          <SettingCard
            icon={AudioWaveform}
            title="Also convert to Mel Spectrogram"
            description="Adds a PNG for every audio clip, zipped alongside it."
            checked={mel.enabled}
            onChange={(e) => mel.setEnabled(e.target.checked)}
          />
        </div>
      </div>



      {mel.enabled && (
        <div className="origin-top animate-reveal">
          <MelOptions mel={mel} />
        </div>
      )}
    </fieldset>
  );
}
