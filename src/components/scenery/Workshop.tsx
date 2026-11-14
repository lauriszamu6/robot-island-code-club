import { cn } from "@/lib/utils";
import { Gear, Cloud } from "./Sky";
import { IslandArt } from "./Island";
import type { Level } from "@/lib/game-data";
import { SpaceBackdrop } from "./Space";

/**
 * Workshop scene. Decorations live in their own side columns and a bottom bench strip,
 * so they never overlap the central game area (instructions, blocks, controls).
 */
export function WorkshopScene({ level, upgrades, children }: { level: Level; upgrades: number[]; children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-[calc(100vh-4rem)] flex-col anim-enter">
      <SpaceBackdrop className="-z-10" />
      <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-4 px-3 pb-0 pt-4 lg:grid-cols-[150px_minmax(0,1fr)_150px] xl:grid-cols-[190px_minmax(0,1fr)_190px]">
        <aside aria-hidden className="hidden flex-col items-center gap-6 pt-6 lg:flex">
          <Shelf />
          <Plant />
          {upgrades.includes(1) && <Lamp />}
          {upgrades.includes(3) && <Antenna />}
        </aside>
        <main className="min-w-0">{children}</main>
        <aside aria-hidden className="hidden flex-col items-center gap-6 pt-2 lg:flex">
          <WorkshopWindow />
          <PartsBox />
          {upgrades.includes(2) && <GearClock />}
          {upgrades.includes(4) && <Counter />}
          {upgrades.includes(5) && <Drone />}
        </aside>
      </div>
      <Workbench accent={level.accent} />
    </div>
  );
}

function Workbench({ accent }: { accent: Level["accent"] }) {
  return (
    <div aria-hidden className="mt-6">
      <svg viewBox="0 0 1200 70" preserveAspectRatio="none" className="block h-14 w-full sm:h-20">
        <rect x="0" y="16" width="1200" height="14" className="fill-wood stroke-navy" strokeWidth="3" />
        <rect x="0" y="30" width="1200" height="40" className="fill-navy" opacity=".9" />
        <g className="hidden sm:block stroke-navy" strokeWidth="3">
          <rect x="60" y="2" width="40" height="14" rx="3" className="fill-coral" />
          <rect x="1080" y="0" width="60" height="16" rx="4" className="fill-teal" />
          <circle cx="1000" cy="9" r="7" className="fill-sun" />
        </g>
      </svg>
      <div className={cn("h-2", accent === "sun" ? "bg-sun" : "bg-teal")} />
    </div>
  );
}

function WorkshopWindow() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] chunky bg-sky">
      <Cloud className="anim-drift absolute left-2 top-2 w-20" />
      <IslandArt accent="coral" status="completed" className="absolute bottom-3 left-1 w-24" />
      <IslandArt accent="lavender" status="available" className="absolute right-1 top-6 w-16" />
      <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-navy" />
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-navy" />
    </div>
  );
}

const S = "stroke-navy";
function Shelf() {
  return (
    <svg viewBox="0 0 140 100" className="w-full">
      <g className={S} strokeWidth="3">
        <rect x="10" y="60" width="120" height="8" className="fill-wood" />
        <rect x="20" y="30" width="20" height="30" rx="3" className="fill-coral" />
        <rect x="46" y="20" width="16" height="40" rx="3" className="fill-sun" />
        <path d="M80 60 l10 -30 l10 30z" className="fill-teal" />
        <rect x="104" y="42" width="18" height="18" rx="9" className="fill-lavender" />
        <path d="M30 68 v20 M110 68 v20" />
      </g>
    </svg>
  );
}
function Plant() {
  return (
    <svg viewBox="0 0 100 110" className="w-24">
      <g className={S} strokeWidth="3">
        <path d="M50 70 Q30 40 20 30 Q40 30 50 60 Q55 20 75 15 Q70 45 52 70" className="fill-teal" />
        <path d="M30 70 h40 l-6 34 h-28z" className="fill-coral" />
      </g>
    </svg>
  );
}
function PartsBox() {
  return (
    <svg viewBox="0 0 140 90" className="w-full">
      <g className={S} strokeWidth="3">
        <rect x="15" y="40" width="110" height="45" rx="6" className="fill-teal" />
        <circle cx="45" cy="34" r="10" className="fill-sun" />
        <rect x="70" y="22" width="30" height="18" rx="4" className="fill-lavender" />
        <path d="M40 62 h60" className="stroke-cream" />
      </g>
    </svg>
  );
}
function Lamp() {
  return (
    <svg viewBox="0 0 100 110" className="w-24" aria-label="Upgrade: glowing desk lamp">
      <circle cx="58" cy="44" r="26" className="fill-sun anim-glow" opacity=".45" />
      <g className={S} strokeWidth="3">
        <path d="M30 100 h40" /><path d="M50 100 L36 64 L58 36" fill="none" />
        <path d="M48 26 L76 38 L64 56 Z" className="fill-coral" />
      </g>
    </svg>
  );
}
function GearClock() {
  return <div className="flex gap-1"><Gear className="w-14 motion-safe:animate-[spin_12s_linear_infinite]" /><Gear className="mt-6 w-9 motion-safe:animate-[spin_8s_linear_infinite_reverse]" /></div>;
}
function Antenna() {
  return (
    <svg viewBox="0 0 80 110" className="w-20"><g className={S} strokeWidth="3">
      <line x1="40" y1="100" x2="40" y2="30" /><circle cx="40" cy="24" r="8" className="fill-sun anim-glow" />
      <path d="M22 18 q-8 6 0 14 M58 18 q8 6 0 14" fill="none" /><rect x="24" y="96" width="32" height="10" className="fill-teal" />
    </g></svg>
  );
}
function Counter() {
  return <div className="rounded-xl chunky bg-navy px-4 py-2 font-mono text-xl font-bold text-sun">0042</div>;
}
function Drone() {
  return (
    <svg viewBox="0 0 120 70" className="w-28 anim-bob"><g className={S} strokeWidth="3">
      <ellipse cx="25" cy="12" rx="18" ry="4" className="fill-lavender" /><ellipse cx="95" cy="12" rx="18" ry="4" className="fill-lavender" />
      <path d="M25 16 v10 M95 16 v10" /><rect x="20" y="26" width="80" height="30" rx="15" className="fill-sun" />
      <circle cx="48" cy="41" r="5" className="fill-navy" /><circle cx="72" cy="41" r="5" className="fill-navy" />
    </g></svg>
  );
}
