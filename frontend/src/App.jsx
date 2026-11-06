import { useCallback, useRef, useState } from "react";
import { Files } from "lucide-react";
import DropZone from "./components/DropZone";
import FileRow from "./components/FileRow";
import FileListDialog from "./components/FileListDialog";
import HelpDialog from "./components/HelpDialog";
import SettingsPanel from "./components/SettingsPanel";
import SortControl from "./components/SortControl";
import JobStatus from "./components/JobStatus";
import { clipsForItem } from "./lib/media";
import { useFileQueue } from "./hooks/useFileQueue";
import { useSplitJob } from "./hooks/useSplitJob";
import { useMelSettings } from "./hooks/useMelSettings";

export default function App() {
  const queue = useFileQueue();
  const job = useSplitJob();
  const mel = useMelSettings();
  const [duration, setDuration] = useState(30);
  const [audioFormat, setAudioFormat] = useState("wav");
  const [audioBitrate, setAudioBitrate] = useState(192);
  const [videoOutput, setVideoOutput] = useState("video");
  const [singleFolder, setSingleFolder] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [accurateVideo, setAccurateVideo] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const helpButtonRef = useRef(null);
  const showMoreRef = useRef(null);
  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    helpButtonRef.current?.focus();
  }, []);
  const closeFiles = useCallback(() => {
    setFilesOpen(false);
    showMoreRef.current?.focus();
  }, []);

  const locked = job.phase !== "idle" && job.phase !== "error";
  const validDuration = duration >= 5 && duration <= 3600;
  const hasVideo = queue.items.some((item) => item.kind === "video");
  const hasFiles = queue.items.length > 0;
  const canSplit = !locked && queue.items.length > 0 && validDuration && !mel.error;

  const nameCompare = (a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: "base" });
  const sortedItems = [...queue.items].sort((a, b) => {
    if (sortBy === "duration" && (a.duration == null || b.duration == null)) {
      // Files still probing their duration stay at the bottom.
      if (a.duration == null && b.duration == null) return nameCompare(a, b);
      return a.duration == null ? 1 : -1;
    }
    let diff;
    if (sortBy === "name") diff = nameCompare(a, b);
    else if (sortBy === "duration") diff = a.duration - b.duration || nameCompare(a, b);
    else diff = a.file.size - b.file.size || nameCompare(a, b);
    return sortDir === "asc" ? diff : -diff;
  });
  const visibleItems = sortedItems.slice(0, 3);
  const totalClips = sortedItems.reduce((sum, item) => sum + (clipsForItem(item, duration, videoOutput) ?? 0), 0);
  const pendingDurations = sortedItems.some((item) => item.kind !== "zip" && !item.duration);

  const removeItem = (id) => {
    if (queue.items.length <= 1) setFilesOpen(false);
    queue.remove(id);
  };

  const reset = () => {
    setFilesOpen(false);
    job.reset();
    queue.clear();
  };

  return (
    <>
      {/* Ambient red/yellow glow bed */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-glow absolute -top-48 left-1/2 h-144 w-xl -translate-x-1/2 rounded-full bg-flame/20 blur-[130px]" />
        <div className="animate-glow absolute top-1/3 -right-40 h-112 w-md rounded-full bg-gold/15 blur-[120px] [animation-delay:2s]" />
        <div className="animate-glow absolute -bottom-48 -left-32 h-120 w-120 rounded-full bg-ember/10 blur-[130px] [animation-delay:4s]" />
      </div>

      <main className={`relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-12 sm:py-16 ${hasFiles ? "" : "justify-center"}`}>
        <div className="space-y-6">
          <header className="animate-fade-up flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="max-w-2xl break-words text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                Audio and video into{" "}
                <span className="bg-linear-to-r from-flame via-ember to-gold bg-clip-text text-transparent">
                  Mel-Spectrogram
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
              aria-label="Open help"
              className="group flex shrink-0 items-center gap-2 rounded-full border border-edge bg-card/80 px-2.5 py-2 text-sm font-semibold backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-[0_0_30px_-8px_rgba(255,201,74,0.6)] sm:px-4"
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
              <span className="hidden sm:inline">Help</span>
            </button>
          </header>

          <div className="animate-fade-up [animation-delay:80ms]">
            <DropZone onFiles={queue.add} disabled={locked} rejected={queue.rejected} />
          </div>

          {hasFiles && (
            <div className="animate-fade-up space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ash">
                  <span className="font-bold text-cream">{sortedItems.length}</span>{" "}
                  {sortedItems.length === 1 ? "file" : "files"}
                  <span className="px-1.5 text-edge">·</span>
                  {totalClips}{pendingDurations ? "+" : ""} clips
                </p>
                <SortControl
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortDir={sortDir}
                  setSortDir={setSortDir}
                />
              </div>

              <ul className="space-y-3">
                {visibleItems.map((item, index) => (
                  <FileRow
                    key={item.id}
                    index={index}
                    item={item}
                    chunk={duration}
                    clips={clipsForItem(item, duration, videoOutput)}
                    stripKind={item.kind === "video" && videoOutput === "audio" ? "audio" : item.kind}
                    onRemove={removeItem}
                    locked={locked}
                  />
                ))}
              </ul>

              {sortedItems.length > 3 && (
                <button
                  ref={showMoreRef}
                  type="button"
                  onClick={() => setFilesOpen(true)}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-edge bg-card/40 px-4 py-3 text-sm font-semibold text-ash transition-all duration-200 hover:border-gold/40 hover:bg-card/70 hover:text-gold"
                >
                  <Files aria-hidden="true" className="h-4 w-4" />
                  Show more
                  <span className="rounded-full border border-edge bg-night/60 px-2 py-0.5 text-[11px] font-bold text-cream transition-colors duration-200 group-hover:border-gold/40 group-hover:text-gold">
                    +{sortedItems.length - 3}
                  </span>
                </button>
              )}
            </div>
          )}

          {hasFiles && (
            <>
              <div className="animate-fade-up [animation-delay:140ms]">
                <SettingsPanel
                  duration={duration} setDuration={setDuration}
                  audioFormat={audioFormat} setAudioFormat={setAudioFormat}
                  audioBitrate={audioBitrate} setAudioBitrate={setAudioBitrate}
                  accurateVideo={accurateVideo} setAccurateVideo={setAccurateVideo}
                  hasVideo={hasVideo}
                  videoOutput={videoOutput} setVideoOutput={setVideoOutput}
                  singleFolder={singleFolder} setSingleFolder={setSingleFolder}
                  includeMedia={includeMedia} setIncludeMedia={setIncludeMedia}
                  disabled={locked}
                  mel={mel}
                />
              </div>

              <button
                onClick={() => job.start(queue.items.map((i) => i.file), duration, { audioFormat, audioBitrate, videoOutput, singleFolder, includeMedia, includeSpectrograms: mel.enabled, accurateVideo, mel: mel.payload })}
                disabled={!canSplit}
                className="group relative animate-fade-up overflow-hidden rounded-2xl bg-linear-to-r from-flame via-ember to-gold px-6 py-4 text-base font-bold text-night shadow-[0_14px_44px_-14px_rgba(255,75,43,0.8)] transition-all duration-300 [animation-delay:200ms] hover:-translate-y-0.5 hover:shadow-[0_20px_54px_-14px_rgba(255,122,26,0.9)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
                <span className="relative">
                  Split {queue.items.length} {queue.items.length === 1 ? "file" : "files"} into {validDuration ? duration : "?"}s clips
                </span>
              </button>

              <JobStatus job={job} onReset={job.phase === "done" ? reset : job.reset} />
            </>
          )}
        </div>
      </main>

      {filesOpen && hasFiles && (
        <FileListDialog
          items={sortedItems}
          chunk={duration}
          videoOutput={videoOutput}
          locked={locked}
          onRemove={removeItem}
          onClose={closeFiles}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortDir={sortDir}
          setSortDir={setSortDir}
        />
      )}

      {helpOpen && <HelpDialog onClose={closeHelp} />}
    </>
  );
}
