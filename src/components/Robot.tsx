import { cn } from "@/lib/utils";

export type Mood = "welcome" | "thinking" | "encourage" | "celebrate";

/** Bolt: original SVG robot companion. Teal body, cream face, navy outlines, coral details. */
export function Robot({ mood = "welcome", className, title = "Bolt the robot" }: { mood?: Mood | undefined; className?: string | undefined; title?: string }) {
  const eyes = {
    welcome: <><ellipse cx="48" cy="44" rx="5" ry="6" /><ellipse cx="72" cy="44" rx="5" ry="6" /></>,
    thinking: <><ellipse cx="50" cy="42" rx="4.5" ry="5" /><ellipse cx="74" cy="42" rx="4.5" ry="5" /></>,
    encourage: <><path d="M42 46 q6 -8 12 0" strokeWidth="4" fill="none" /><path d="M66 46 q6 -8 12 0" strokeWidth="4" fill="none" /></>,
    celebrate: <><path d="M48 38 l2 5 5 .5 -4 3 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3 5 -.5z" /><path d="M72 38 l2 5 5 .5 -4 3 1.5 5 -4.5 -3 -4.5 3 1.5 -5 -4 -3 5 -.5z" /></>,
  }[mood];
  const mouth = {
    welcome: <path d="M52 56 q8 7 16 0" fill="none" strokeWidth="3.5" strokeLinecap="round" />,
    thinking: <path d="M54 58 h12" strokeWidth="3.5" strokeLinecap="round" />,
    encourage: <path d="M50 55 q10 9 20 0" fill="none" strokeWidth="3.5" strokeLinecap="round" />,
    celebrate: <path d="M50 54 q10 12 20 0 z" className="fill-coral" strokeWidth="3" />,
  }[mood];
  const armUp = mood === "welcome" || mood === "celebrate";
  return (
    <svg viewBox="0 0 120 140" className={cn("overflow-visible", className)} role="img" aria-label={title}>
      <g className="stroke-navy" strokeWidth="3.5" strokeLinejoin="round">
        {/* antenna */}
        <line x1="60" y1="18" x2="60" y2="6" />
        <circle cx="60" cy="6" r="5" className={cn("fill-coral", mood === "celebrate" && "anim-glow")} />
        {/* head */}
        <rect x="26" y="18" width="68" height="54" rx="16" className="fill-teal" />
        <rect x="35" y="27" width="50" height="38" rx="10" className="fill-cream" />
        <g className="fill-navy stroke-navy anim-blink">{eyes}</g>
        <g className="stroke-navy">{mouth}</g>
        <circle cx="24" cy="45" r="5" className="fill-sun" />
        <circle cx="96" cy="45" r="5" className="fill-sun" />
        {/* neck + body */}
        <rect x="52" y="72" width="16" height="8" className="fill-lavender" />
        <rect x="32" y="80" width="56" height="38" rx="12" className="fill-teal" />
        <rect x="46" y="88" width="28" height="14" rx="4" className="fill-cream" />
        <circle cx="53" cy="95" r="3" className="fill-coral" strokeWidth="2" />
        <circle cx="67" cy="95" r="3" className="fill-sun" strokeWidth="2" />
        {/* arms */}
        <path d="M32 92 q-14 4 -16 18" fill="none" strokeWidth="6" strokeLinecap="round" />
        <circle cx="16" cy="112" r="5" className="fill-coral" />
        <g className={armUp ? "anim-wave" : undefined}>
          <path d={armUp ? "M88 90 q14 -8 16 -24" : "M88 92 q14 4 16 18"} fill="none" strokeWidth="6" strokeLinecap="round" />
          <circle cx="104" cy={armUp ? 64 : 112} r="5" className="fill-coral" />
        </g>
        {/* legs */}
        <rect x="40" y="118" width="14" height="10" className="fill-lavender" />
        <rect x="66" y="118" width="14" height="10" className="fill-lavender" />
        <rect x="34" y="126" width="24" height="10" rx="5" className="fill-navy" />
        <rect x="62" y="126" width="24" height="10" rx="5" className="fill-navy" />
      </g>
    </svg>
  );
}

export function RobotSays({ mood, children, className }: { mood?: Mood | undefined; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      <Robot mood={mood} className="h-20 w-16 shrink-0 anim-bob" />
      <div className="relative rounded-2xl rounded-bl-sm chunky bg-card px-4 py-3 text-base font-semibold">{children}</div>
    </div>
  );
}
