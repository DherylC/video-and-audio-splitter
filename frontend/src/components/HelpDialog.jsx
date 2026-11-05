import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";

const QUICK_START = [
  {
    title: "FRONTEND QUICK START",
    code: `cd frontend
npm run dev`,
  },
  {
    title: "BACKEND QUICK START",
    code: `cd backend
python -m uvicorn app.main:app --reload --port 8000`,
  }
]


const COMMANDS = [
  {
    title: "1. Backend — FastAPI + FFmpeg",
    note: "Terminal 1, from the project root",
    code: `cd backend
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000`,
  },
  {
    title: "2. Frontend — React + Vite",
    note: "Terminal 2, from the project root",
    code: `cd frontend
npm install
npm run dev`,
  },
  {
    title: "3. Verify the backend",
    note: "Expected: status ok",
    code: `Invoke-RestMethod http://127.0.0.1:8000/health`,
  },
  {
    title: "PowerShell blocks the virtual env?",
    note: "Run this once in the same window, then retry activation",
    code: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\\.venv\\Scripts\\Activate.ps1`,
  },
];

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

function CopyButton({ title, code, copyKey, copied, onCopy }) {
  const isCopied = copied === copyKey;
  return (
    <>
      <button
        onClick={() => onCopy(copyKey, code)}
        aria-label={isCopied ? `${title} copied` : `Copy ${title} commands`}
        title={isCopied ? "Copied" : "Copy"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${isCopied
            ? "border-gold/60 bg-gold/15 text-gold shadow-[0_0_20px_-6px_rgba(255,201,74,0.8)]"
            : "border-edge bg-card text-cream hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold"
          }`}
      >
        {isCopied ? (
          <Check aria-hidden="true" className="h-4 w-4 animate-pop" strokeWidth={2.5} />
        ) : (
          <Copy aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {isCopied ? `${title} copied` : ""}
      </span>
    </>
  );
}

export default function HelpDialog({ onClose }) {
  const [copied, setCopied] = useState(null);
  const closeRef = useRef(null);
  const timerRef = useRef(null);

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

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copy = async (key, code) => {
    await writeClipboard(code);
    setCopied(key);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-night/75 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="animate-pop my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-edge bg-coal shadow-[0_40px_120px_-40px_rgba(255,75,43,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden="true" className="h-1 bg-linear-to-r from-flame via-ember to-gold" />

        <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
          <div>
            <h2 id="help-title" className="text-xl font-extrabold tracking-tight">Run it locally</h2>
            <p className="mt-1 text-sm text-ash">
              Two terminals: API on :8000, Vite on :5173. No .env file needed.
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close help"
            title="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-edge bg-card text-cream transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:text-gold"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>


        <div className="space-y-5 mx-6 px-5 py-5 sm:px-6 bg-amber-600/20 rounded-2xl">
          <p className="text-sm text-ash">
            Quick start commands for the frontend and backend. Use these if you already have the dependencies installed.
          </p>
          {QUICK_START.map((cmd, index) => (
            <section key={cmd.title} className="animate-fade-up" style={{ animationDelay: `${80 + index * 60}ms` }}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">{cmd.title}</h3>
                  {cmd.note && <p className="mt-0.5 text-xs text-ash">{cmd.note}</p>}
                </div>
                <CopyButton
                  title={cmd.title}
                  code={cmd.code}
                  copyKey={`quick:${cmd.title}`}
                  copied={copied}
                  onCopy={copy}
                />
              </div>
              <pre className="select-text overflow-x-auto rounded-2xl border border-edge/80 bg-night/80 px-4 py-3.5 text-xs leading-relaxed text-cream/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <code className="select-text">{cmd.code}</code>
              </pre>
            </section>
          ))}
        </div>

        <div className="pt-10 space-y-5 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-extrabold tracking-tight">Full commands</h2>
          <p className="text-sm text-ash pb-4">
            Find below the full commands to set up the backend and frontend, verify the backend, and fix PowerShell virtual environment activation issues.
          </p>
          {COMMANDS.map((cmd, index) => (
            <section key={cmd.title} className="animate-fade-up" style={{ animationDelay: `${80 + index * 60}ms` }}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">{cmd.title}</h3>
                  {cmd.note && <p className="mt-0.5 text-xs text-ash">{cmd.note}</p>}
                </div>
                <CopyButton
                  title={cmd.title}
                  code={cmd.code}
                  copyKey={`full:${cmd.title}`}
                  copied={copied}
                  onCopy={copy}
                />
              </div>
              <pre className="select-text overflow-x-auto rounded-2xl border border-edge/80 bg-night/80 px-4 py-3.5 text-xs leading-relaxed text-cream/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <code className="select-text">{cmd.code}</code>
              </pre>
            </section>
          ))}

          <p className="border-t border-edge/70 pt-4 text-xs text-ash">
            Prerequisites: Python 3.10+, Node 20.19+, and FFmpeg + ffprobe on PATH.
          </p>
        </div>
      </div>
    </div>
  );
}
