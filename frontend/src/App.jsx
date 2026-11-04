import { useCallback, useRef, useState } from "react";
import DropZone from "./components/DropZone";
import FileRow from "./components/FileRow";
import HelpDialog from "./components/HelpDialog";
import SettingsPanel from "./components/SettingsPanel";
import JobStatus from "./components/JobStatus";
import { useFileQueue } from "./hooks/useFileQueue";
import { useSplitJob } from "./hooks/useSplitJob";

export default function App() {
  const queue = useFileQueue();
  const job = useSplitJob();
  const [duration, setDuration] = useState(30);
  const [audioFormat, setAudioFormat] = useState("wav");
  const [accurateVideo, setAccurateVideo] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButtonRef = useRef(null);
  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    helpButtonRef.current?.focus();
  }, []);

  const locked = job.phase !== "idle" && job.phase !== "error";
  const validDuration = duration >= 1 && duration <= 3600;
  const canSplit = !locked && queue.items.length > 0 && validDuration;

  const reset = () => { job.reset(); queue.clear(); };

  return (
    <>
      {/* Ambient red/yellow glow bed */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-glow absolute -top-48 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-flame/20 blur-[130px]" />
        <div className="animate-glow absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-[120px] [animation-delay:2s]" />
        <div className="animate-glow absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-ember/10 blur-[130px] [animation-delay:4s]" />
      </div>

      <main className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <div className="space-y-6">
          <header className="animate-fade-up flex items-start justify-between gap-4">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-edge bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ash backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-flame to-gold shadow-[0_0_10px_rgba(255,122,26,0.85)]" />
                Media splitter
              </p>
              <h1 className="max-w-2xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                Split audio and video into{" "}
                <span className="bg-gradient-to-r from-flame via-ember to-gold bg-clip-text text-transparent">
                  equal clips
                </span>
              </h1>
              <p className="mt-4 max-w-xl leading-relaxed text-ash">
                Audio clips are padded with silence so every one has the full length. Video clips keep their real length, so the last one can be shorter.
              </p>
            </div>
            <button
              ref={helpButtonRef}
              onClick={() => setHelpOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={helpOpen}
              className="group flex shrink-0 items-center gap-2 rounded-full border border-edge bg-card/80 px-4 py-2 text-sm font-semibold backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_0_30px_-8px_rgba(255,201,74,0.6)]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-4 w-4 text-gold transition-transform duration-300 group-hover:rotate-12"
              >
                <path d="M9.1 9a3 3 0 1 1 4.6 2.5c-.9.6-1.7 1.2-1.7 2.5" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              Help
            </button>
          </header>

          <div className="animate-fade-up [animation-delay:80ms]">
            <DropZone onFiles={queue.add} disabled={locked} rejected={queue.rejected} />
          </div>

          {queue.items.length > 0 && (
            <ul className="space-y-3">
              {queue.items.map((item, index) => (
                <FileRow
                  key={item.id}
                  index={index}
                  item={item}
                  chunk={duration}
                  onRemove={queue.remove}
                  locked={locked}
                />
              ))}
            </ul>
          )}

          <div className="animate-fade-up [animation-delay:140ms]">
            <SettingsPanel
              duration={duration} setDuration={setDuration}
              audioFormat={audioFormat} setAudioFormat={setAudioFormat}
              accurateVideo={accurateVideo} setAccurateVideo={setAccurateVideo}
              disabled={locked}
            />
          </div>

          <button
            onClick={() => job.start(queue.items.map((i) => i.file), duration, { audioFormat, accurateVideo })}
            disabled={!canSplit}
            className="group relative animate-fade-up overflow-hidden rounded-2xl bg-gradient-to-r from-flame via-ember to-gold px-6 py-4 text-base font-bold text-night shadow-[0_14px_44px_-14px_rgba(255,75,43,0.8)] transition-all duration-300 [animation-delay:200ms] hover:-translate-y-0.5 hover:shadow-[0_20px_54px_-14px_rgba(255,122,26,0.9)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <span className="relative">
              Split {queue.items.length > 0 ? `${queue.items.length} ${queue.items.length === 1 ? "file" : "files"}` : "files"} into {validDuration ? duration : "?"}s clips
            </span>
          </button>

          <JobStatus job={job} onReset={job.phase === "done" ? reset : job.reset} />
        </div>
      </main>

      {helpOpen && <HelpDialog onClose={closeHelp} />}
    </>
  );
}
