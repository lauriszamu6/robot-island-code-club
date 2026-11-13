import { cn } from "@/lib/utils";

/** Lightweight SVG sky: cream clouds, lavender hills, a few mechanical details. */
export function SkyBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-sky via-cream to-lavender-soft", className)}>
      <svg className="absolute inset-x-0 bottom-0 h-56 w-full" viewBox="0 0 400 100" preserveAspectRatio="none">
        <path d="M0 70 Q60 30 120 60 T250 50 T400 55 V100 H0Z" className="fill-lavender" opacity=".35" />
        <path d="M0 85 Q80 55 170 80 T400 75 V100 H0Z" className="fill-lavender" opacity=".5" />
      </svg>
      <Cloud className="anim-drift absolute left-[4%] top-[6%] w-40" />
      <Cloud className="anim-drift-slow absolute right-[6%] top-[22%] w-52" />
      <Cloud className="anim-drift absolute left-[10%] top-[48%] w-32 opacity-80" />
      <Cloud className="anim-drift-slow absolute right-[2%] top-[70%] w-44" />
      <Gear className="absolute right-[14%] top-[10%] w-8 opacity-30" />
      <Gear className="absolute left-[6%] top-[33%] w-6 opacity-25" />
      <svg className="absolute left-[80%] top-[42%] w-10 opacity-40" viewBox="0 0 40 20"><path d="M2 10 h10 l4 -6 l6 12 l4 -6 h12" className="stroke-teal" strokeWidth="2" fill="none" /></svg>
    </div>
  );
}

export function Cloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 50" className={className}>
      <path d="M20 45 Q2 45 6 32 Q8 20 24 22 Q28 6 48 10 Q60 0 74 12 Q96 6 100 24 Q118 26 114 40 Q112 46 100 45Z" className="fill-cream stroke-navy" strokeOpacity=".12" strokeWidth="2" />
    </svg>
  );
}

export function Gear({ className }: { className?: string }) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <g className="fill-navy">
        {teeth.map((r) => <rect key={r} x="17" y="1" width="6" height="8" rx="1" transform={`rotate(${r} 20 20)`} />)}
        <circle cx="20" cy="20" r="13" />
      </g>
      <circle cx="20" cy="20" r="5" className="fill-cream" />
    </svg>
  );
}
