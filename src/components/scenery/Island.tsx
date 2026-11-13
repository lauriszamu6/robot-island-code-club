import { cn } from "@/lib/utils";
import type { Level } from "@/lib/game-data";

export const ACCENT_FILL: Record<Level["accent"], string> = {
  teal: "fill-teal", coral: "fill-coral", sun: "fill-sun", lavender: "fill-lavender", mint: "fill-mint",
};
export const ACCENT_BG: Record<Level["accent"], string> = {
  teal: "bg-teal", coral: "bg-coral", sun: "bg-sun", lavender: "bg-lavender", mint: "bg-mint",
};

/** Floating island with a small robot workshop. */
export function IslandArt({ accent, status, className }: { accent: Level["accent"]; status: "locked" | "available" | "completed"; className?: string }) {
  const locked = status === "locked";
  const done = status === "completed";
  return (
    <svg viewBox="0 0 220 170" className={cn(className, locked && "opacity-70 saturate-50")} aria-hidden>
      <g className="stroke-navy" strokeWidth="3" strokeLinejoin="round">
        {/* rock underside */}
        <path d="M20 100 Q110 100 200 100 L170 130 Q150 160 112 166 Q80 160 60 135Z" className="fill-wood" />
        <path d="M70 120 L90 150 M140 118 L125 152" strokeWidth="2" opacity=".4" />
        {/* propeller / mechanical detail */}
        <line x1="196" y1="104" x2="210" y2="120" strokeWidth="2.5" />
        <ellipse cx="212" cy="124" rx="8" ry="3" className="fill-lavender" />
        {/* grass top */}
        <path d="M12 100 Q20 84 50 86 Q110 78 170 86 Q205 86 208 100 Z" className="fill-mint" />
        {/* workshop */}
        <rect x="70" y="50" width="76" height="44" rx="6" className="fill-cream" />
        <path d="M62 54 L108 22 L154 54 Z" className={ACCENT_FILL[accent]} />
        <circle cx="108" cy="40" r="7" className="fill-cream" />
        <path d="M108 35 v10 M103 40 h10" strokeWidth="2" />
        <rect x="96" y="66" width="24" height="28" rx="4" className="fill-teal" />
        <rect x="78" y="62" width="12" height="12" rx="2" className={done ? "fill-sun" : "fill-sky"} />
        <rect x="126" y="62" width="12" height="12" rx="2" className={done ? "fill-sun" : "fill-sky"} />
        {/* chimney gear */}
        <rect x="132" y="22" width="10" height="20" className="fill-lavender" />
        {/* little tree */}
        <circle cx="38" cy="78" r="12" className="fill-teal" />
        <line x1="38" y1="88" x2="38" y2="96" />
        {done && (
          <>
            <circle cx="84" cy="68" r="12" className="fill-sun anim-glow" stroke="none" opacity=".45" />
            <circle cx="132" cy="68" r="12" className="fill-sun anim-glow" stroke="none" opacity=".45" />
            <line x1="180" y1="92" x2="180" y2="52" />
            <path d="M180 52 L204 60 L180 68 Z" className="fill-coral" />
            {/* string lights */}
            <path d="M62 54 Q85 64 108 56 Q130 64 154 54" fill="none" strokeWidth="1.5" />
            {[74, 92, 124, 142].map((x) => <circle key={x} cx={x} cy={59} r="3" className="fill-sun" strokeWidth="1.5" />)}
          </>
        )}
        {locked && (
          <g>
            <rect x="94" y="74" width="28" height="22" rx="4" className="fill-navy" />
            <path d="M100 74 v-6 a8 8 0 0 1 16 0 v6" fill="none" strokeWidth="4" />
          </g>
        )}
      </g>
    </svg>
  );
}

/** Dotted path between islands, alternating direction. */
export function DottedPath({ flip, active }: { flip?: boolean; active?: boolean }) {
  return (
    <svg viewBox="0 0 300 80" className="mx-auto -my-2 h-16 w-full max-w-md" aria-hidden preserveAspectRatio="xMidYMid meet">
      <path
        d={flip ? "M220 0 C220 40 80 40 80 80" : "M80 0 C80 40 220 40 220 80"}
        fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 12"
        className={active ? "stroke-teal" : "stroke-navy/40"}
      />
    </svg>
  );
}
