import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, Play, Star, Flag } from "lucide-react";
import { Card, DemoFunds, Loading, NeedsPlan } from "@/components/AppShell";
import { GoalMeter } from "@/components/GoalMeter";
import { RobotSays } from "@/components/Robot";
import { SkyBackdrop } from "@/components/scenery/Sky";
import { DottedPath, IslandArt, ACCENT_BG } from "@/components/scenery/Island";
import { useDemo, useIsClient, todayISO } from "@/lib/demo-store";
import { LEVELS, gamesForLevel } from "@/lib/game-data";
import { nextGame } from "@/lib/recommend";
import { eur, levelStatus, completedCount, type DemoState } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Island map — Robot Builders" },
      { name: "description", content: "Five floating workshop islands, each with three coding games: sequences, loops, conditions, variables and debugging." },
      { property: "og:title", content: "Island map — Robot Builders" },
      { property: "og:description", content: "Travel across five floating workshop islands of coding games." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const client = useIsClient();
  const s = useDemo();
  if (!client) return <Loading />;
  if (!s.plan) return <NeedsPlan role={s.role} />;
  const next = nextGame(s);
  const done = completedCount(s);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <SkyBackdrop />
      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 lg:order-1">
          <h1 className="sr-only">Island map</h1>
          <ol className="flex flex-col">
            {LEVELS.map((l, i) => {
              const st = levelStatus(s, l.n);
              const isNext = next?.level === l.n;
              return (
                <li key={l.n}>
                  {i > 0 && <DottedPath flip={i % 2 === 0} active={st !== "locked"} />}
                  <div className={cn("flex", i % 2 === 0 ? "justify-start sm:pl-6" : "justify-end sm:pr-6")}>
                    <IslandCard level={l} status={st} isNext={isNext} s={s} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <aside className="order-1 flex flex-col gap-4 lg:order-2 lg:sticky lg:top-20 lg:self-start">
          <RobotSays mood={done === 15 ? "celebrate" : "welcome"}>
            {done === 15 ? "Every island is fixed! Amazing building." : `Hi ${s.childName || "builder"}! ${done} of 15 games done.`}
          </RobotSays>
          {next && (
            <Card className="bg-teal-soft">
              <p className="text-sm font-extrabold uppercase tracking-wide">Recommended next</p>
              <p className="mt-1 text-xl font-extrabold">{next.title}</p>
              <p className="text-sm">Level {next.level} · {LEVELS[next.level - 1]!.concept}</p>
              <Link to="/play/$gameId" params={{ gameId: next.id }} search={{ mode: "normal" }} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-2xl chunky bg-coral px-5 font-extrabold text-primary-foreground"><Play className="size-5" /> Play</Link>
            </Card>
          )}
          <Card>
            <GoalMeter s={s} compact />
            <p className="mt-3 text-sm"><strong>Next reward:</strong> {next ? `${eur(s.plan.perGame)} for finishing “${next.title}”` : "all earned!"}</p>
            <p className="text-sm"><strong>Redeem from:</strong> {format(parseISO(s.plan.redeemDate), "d MMM yyyy")}{todayISO() >= s.plan.redeemDate && " (ready!)"}</p>
            <Link to="/rewards" className="mt-3 inline-block text-sm font-extrabold text-teal underline underline-offset-4">See goal & history</Link>
            <DemoFunds className="mt-3" />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function IslandCard({ level, status, isNext, s }: { level: (typeof LEVELS)[number]; status: "locked" | "available" | "completed"; isNext: boolean; s: DemoState }) {
  const games = gamesForLevel(level.n);
  const badge = {
    locked: { icon: <Lock className="size-4" />, text: "Locked", cls: "bg-cream-deep" },
    available: { icon: <Play className="size-4" />, text: isNext ? "Next up" : "Open", cls: "bg-sun" },
    completed: { icon: <CheckCircle2 className="size-4" />, text: "Completed", cls: "bg-mint" },
  }[status];
  const inner = (
    <div className={cn("relative w-[min(100%,360px)] transition-transform", status !== "locked" && "hover:-translate-y-1", isNext && "anim-bob")}>
      {isNext && <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full chunky bg-coral px-3 py-1 text-xs font-extrabold text-primary-foreground">▼ Start here</span>}
      <IslandArt accent={level.accent} status={status} className="w-full drop-shadow-lg" />
      <div className={cn("-mt-4 rounded-2xl chunky bg-card p-3", isNext && "ring-4 ring-coral/60")}>
        <div className="flex items-center gap-2">
          <span className={cn("flex size-9 items-center justify-center rounded-full border-2 border-navy font-display text-lg font-extrabold", ACCENT_BG[level.accent])}>{level.n}</span>
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold leading-tight">{level.concept}</p>
            <p className="text-xs text-muted-foreground">{level.tagline}</p>
          </div>
          <span className={cn("ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border-2 border-navy px-2 py-0.5 text-xs font-extrabold", badge.cls)}>{badge.icon}{badge.text}</span>
        </div>
        <ul className="mt-2 flex gap-2" aria-label="Games">
          {games.map((g, i) => {
            const d = !!s.completed[g.id];
            return (
              <li key={g.id} className={cn("flex flex-1 items-center justify-center gap-1 rounded-lg border-2 py-1 text-xs font-bold", d ? "border-navy bg-mint" : status === "locked" ? "border-navy/30 text-muted-foreground" : "border-navy bg-cream")}>
                {d ? <Star className="size-3.5 fill-sun" /> : status === "locked" ? <Lock className="size-3.5" /> : <span className="size-3 rounded-full border-2 border-navy" />}
                Game {i + 1}<span className="sr-only">{d ? " done" : status === "locked" ? " locked" : " to do"}</span>
              </li>
            );
          })}
        </ul>
        {status === "completed" && <p className="mt-2 flex items-center gap-1 text-xs font-bold"><Flag className="size-3.5 text-coral" /> Workshop upgrade: {level.upgrade}</p>}
      </div>
    </div>
  );
  return status === "locked" ? <div aria-disabled title="Finish the previous island to unlock">{inner}</div> : <Link to="/level/$levelId" params={{ levelId: String(level.n) }} aria-label={`Level ${level.n}: ${level.concept}, ${badge.text}`}>{inner}</Link>;
}
