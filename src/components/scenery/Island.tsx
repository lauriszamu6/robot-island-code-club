import { cn } from "@/lib/utils";
import type { Level } from "@/lib/game-data";

export const ACCENT_FILL: Record<Level["accent"], string> = {
  teal: "fill-teal", coral: "fill-coral", sun: "fill-sun", lavender: "fill-lavender", mint: "fill-mint",
};
export const ACCENT_BG: Record<Level["accent"], string> = {
  teal: "bg-teal", coral: "bg-coral", sun: "bg-sun", lavender: "bg-lavender", mint: "bg-mint",
};

/** Orbital space dock with a docked rocketship. */
export function IslandArt({ accent, status, className }: { accent: Level["accent"]; status: "locked" | "available" | "completed"; className?: string }) {
  const locked = status === "locked";
  const done = status === "completed";
  return (
    <svg viewBox="0 0 220 170" className={cn(className, locked && "opacity-70 saturate-50")} aria-hidden>
      {/* soft glow halo */}
      <ellipse cx="110" cy="128" rx="100" ry="26" className={cn(ACCENT_FILL[accent], "anim-glow")} opacity=".25" />
      <g className="stroke-navy" strokeWidth="3" strokeLinejoin="round">
        {/* solar arrays */}
        <rect x="4" y="112" width="34" height="16" rx="2" className="fill-teal" />
        <path d="M15 112 v16 M27 112 v16" strokeWidth="1.5" />
        <rect x="182" y="112" width="34" height="16" rx="2" className="fill-teal" />
        <path d="M193 112 v16 M205 112 v16" strokeWidth="1.5" />
        <path d="M38 120 h14 M168 120 h14" />
        {/* dock platform ring */}
        <ellipse cx="110" cy="128" rx="60" ry="16" className="fill-lavender" />
        <ellipse cx="110" cy="124" rx="44" ry="10" className="fill-navy" />
        {[60, 85, 135, 160].map((x) => <circle key={x} cx={x} cy={134} r="3" className={done ? "fill-sun" : "fill-teal"} strokeWidth="1.5" />)}
        {/* docking clamps */}
        <path d="M78 122 L86 96 M142 122 L134 96" strokeWidth="4" />
        {/* thruster flame */}
        {!locked && <path d="M100 120 Q110 150 120 120 Z" className={cn(done ? "fill-sun" : "fill-coral", "anim-glow")} strokeWidth="2" />}
        {/* rocket fins */}
        <path d="M92 92 L74 118 L94 112 Z" className={ACCENT_FILL[accent]} />
        <path d="M128 92 L146 118 L126 112 Z" className={ACCENT_FILL[accent]} />
        {/* rocket body */}
        <path d="M110 10 Q134 40 130 112 H90 Q86 40 110 10 Z" className="fill-cream" />
        <path d="M110 10 Q124 26 127 40 H93 Q96 26 110 10 Z" className="fill-coral" />
        <rect x="98" y="104" width="24" height="10" rx="2" className="fill-navy" />
        {/* porthole */}
        <circle cx="110" cy="62" r="11" className={done ? "fill-sun" : "fill-sky"} />
        <circle cx="106" cy="58" r="3" className="fill-cream" stroke="none" />
        <circle cx="110" cy="88" r="5" className={done ? "fill-sun" : "fill-teal"} strokeWidth="2" />
        {done && (
          <>
            <circle cx="110" cy="62" r="18" className="fill-sun anim-glow" stroke="none" opacity=".35" />
            <path d="M170 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z" className="fill-sun" strokeWidth="1.5" />
            <path d="M44 60 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" className="fill-mint" strokeWidth="1.5" />
          </>
        )}
        {locked && (
          <g>
            <rect x="96" y="70" width="28" height="22" rx="4" className="fill-navy" />
            <path d="M102 70 v-6 a8 8 0 0 1 16 0 v6" fill="none" strokeWidth="4" />
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
