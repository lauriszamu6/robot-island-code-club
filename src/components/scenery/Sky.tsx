import { cn } from "@/lib/utils";
import { SpaceBackdrop } from "./Space";

/** Shared space scenery; clouds and gears remain available for workshop details. */
export function SkyBackdrop({ className }: { className?: string }) {
  return <SpaceBackdrop className={className} />;
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
