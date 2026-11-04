export default function JobStatus({ job, onReset }) {
  const { phase } = job;
  if (phase === "idle") return null;

  const pct = phase === "uploading" ? job.uploadPct : job.total ? Math.round((job.done / job.total) * 100) : 0;

  if (phase === "error") {
    return (
      <div role="alert" className="animate-pop rounded-2xl border border-danger/40 bg-danger/10 p-5">
        <p className="font-bold text-danger">Splitting failed</p>
        <p className="mt-1 text-sm text-ash">{job.error}</p>
        <button
          onClick={onReset}
          className="mt-3 rounded-full border border-danger/40 px-3 py-1 text-sm text-danger transition-colors duration-200 hover:bg-danger/10"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="animate-pop relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-card via-card to-flame/10 p-5 shadow-[0_24px_60px_-40px_rgba(255,122,26,0.8)]">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
        <p className="font-bold">{job.total} clips ready</p>
        {job.failed.length > 0 && (
          <ul className="my-2 space-y-1 text-sm text-danger">
            {job.failed.map((f) => <li key={f.source}>{f.source}: {f.error}</li>)}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <a
            href={job.downloadUrl}
            download
            className="rounded-full bg-gradient-to-r from-flame via-ember to-gold px-5 py-2.5 font-bold text-night shadow-[0_10px_32px_-12px_rgba(255,122,26,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(255,201,74,0.9)]"
          >
            Download zip
          </a>
          <button onClick={onReset} className="text-sm text-ash underline-offset-4 transition-colors duration-200 hover:text-gold hover:underline">
            Split more files
          </button>
        </div>
      </div>
    );
  }

  return (
    <div role="status" className="animate-fade-up rounded-2xl border border-edge bg-card/70 p-5 backdrop-blur">
      <p className="mb-3 font-medium">
        {phase === "uploading" ? `Uploading, ${pct}%` : `Splitting ${job.done} of ${job.total || "…"}${job.current ? `, ${job.current}` : ""}`}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-edge/60">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-flame via-ember to-gold shadow-[0_0_18px_rgba(255,122,26,0.65)] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
