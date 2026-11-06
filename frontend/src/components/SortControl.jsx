import { ArrowDown, ArrowDownAZ, ArrowUp, Clock3, HardDrive } from "lucide-react";

const OPTIONS = [
  { value: "name", label: "Name", icon: ArrowDownAZ },
  { value: "duration", label: "Duration", icon: Clock3 },
  { value: "size", label: "Size", icon: HardDrive },
];

export default function SortControl({ sortBy, setSortBy, sortDir, setSortDir, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ash">Sort</span>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = sortBy === value;
        const Direction = sortDir === "asc" ? ArrowUp : ArrowDown;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`Sort by ${label.toLowerCase()}${active ? `, currently ${sortDir === "asc" ? "ascending" : "descending"}. Activate to reverse` : ""}`}
            title={active ? "Click again to reverse the order" : `Sort by ${label.toLowerCase()}`}
            onClick={() => {
              if (active) {
                setSortDir((current) => (current === "asc" ? "desc" : "asc"));
              } else {
                setSortBy(value);
                setSortDir("asc");
              }
            }}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${active
              ? "border-gold/60 bg-linear-to-r from-flame to-gold text-night shadow-[0_0_20px_-10px_rgba(255,201,74,0.9)]"
              : "border-edge bg-coal/60 text-cream hover:border-gold/40 hover:text-gold"
              }`}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {label}
            {active && <Direction aria-hidden="true" className="h-3 w-3" strokeWidth={2.5} />}
          </button>
        );
      })}
    </div>
  );
}
