import { feedbackQuery, objectivesQuery } from "@/lib/insights-data";
import { nextChallenge } from "@/lib/recommend";
import { useQuery as useWalletQ } from "@tanstack/react-query";
import { euro, summarize, walletQuery } from "@/lib/wallet-data";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, Play, Star, Flag } from "lucide-react";
import { Card, DemoFunds } from "@/components/AppShell";
import { GoalMeter } from "@/components/GoalMeter";
import { RobotSays } from "@/components/Robot";
import { SkyBackdrop } from "@/components/scenery/Sky";
import { DottedPath, IslandArt, ACCENT_BG } from "@/components/scenery/Island";
import { useDemo, todayISO } from "@/lib/demo-store";
import type { Game, Level } from "@/lib/game-data";
import { levelState, nextOpenGame } from "@/lib/adventure-data";
import { AdventureGate, type Adventure } from "@/components/AdventureGate";
import { eur } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Island map — Astrobit" },
      { name: "description", content: "Five floating workshop islands, each with three coding games: sequences, loops, conditions, variables and debugging." },
      { property: "og:title", content: "Island map — Astrobit" },
      { property: "og:description", content: "Travel across five floating workshop islands of coding games." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  return <AdventureGate>{(a) => <MapView a={a} />}</AdventureGate>;
}

function MapView({ a }: { a: Adventure }) {
  const s = useDemo();
  const { levels, games } = a.content;
  const next = nextOpenGame(games, a.done);
  const done = a.done.size;
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <SkyBackdrop />
      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 lg:order-1">
          <h1 className="sr-only">Island map</h1>
          <ol className="flex flex-col">
            {levels.map((l, i) => {
              const st = levelState(games, a.done, l.n);
              const isNext = next?.level === l.n;
              return (
                <li key={l.n}>
                  {i > 0 && <DottedPath flip={i % 2 === 0} active={st !== "locked"} />}
                  <div className={cn("flex", i % 2 === 0 ? "justify-start sm:pl-6" : "justify-end sm:pr-6")}>
                    <IslandCard level={l} status={st} isNext={isNext} games={games.filter((g) => g.level === l.n)} done={a.done} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <aside className="order-1 flex flex-col gap-4 lg:order-2 lg:sticky lg:top-20 lg:self-start">
          <RobotSays companion={a.child.avatar} mood={done === games.length ? "celebrate" : "welcome"}>
            {done === games.length ? "Every island is fixed! Amazing building." : `Hi ${a.child.nickname}! ${done} of ${games.length} games done.`}
          </RobotSays>
          <Link to="/companion" className="self-start text-sm font-extrabold text-teal underline underline-offset-4">{a.child.avatar ? "Change my robot" : "Build my robot companion"}</Link>
          <NextChallenge a={a} />
          <MapGoal a={a} next={next} />
        </aside>
      </div>
    </div>
  );
}

function IslandCard({ level, status, isNext, games, done }: { level: Level; status: "locked" | "available" | "completed"; isNext: boolean; games: Game[]; done: Set<string> }) {
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
            const d = done.has(g.id);
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

function MapGoal({ a, next }: { a: Adventure; next: { title: string } | null | undefined }) {
  const q = useWalletQ(walletQuery(a.child.id));
  if (q.error) return <Card><p className="text-sm font-bold">Couldn't load the savings goal.</p><button className="text-sm font-bold text-teal underline" onClick={() => q.refetch()}>Try again</button></Card>;
  const w = q.data;
  if (!w?.plan || !w.goal) return null;
  const sum = summarize(w, a.content.games, a.content.levels, a.done);
  return (
    <Card>
      <GoalMeter w={w} sum={sum} compact />
      <p className="mt-3 text-sm"><strong>Next reward:</strong> {next && !w.goal.redeemed_at ? `${euro(w.plan.per_game_cents)} for finishing “${next.title}”` : "all earned!"}</p>
      <p className="text-sm"><strong>Redeem from:</strong> {format(parseISO(w.goal.redeem_date), "d MMM yyyy")}{todayISO() >= w.goal.redeem_date && " (ready!)"}</p>
      <Link to="/rewards" className="mt-3 inline-block text-sm font-extrabold text-teal underline underline-offset-4">See goal & history</Link>
      <DemoFunds className="mt-3" />
    </Card>
  );
}

function NextChallenge({ a }: { a: Adventure }) {
  const fb = useWalletQ(feedbackQuery(a.child.id));
  const ob = useWalletQ(objectivesQuery);
  if (fb.error || ob.error) return <Card><p className="text-sm font-bold">Couldn't load your next challenge.</p><button className="text-sm font-bold text-teal underline" onClick={() => { fb.refetch(); ob.refetch(); }}>Try again</button></Card>;
  if (!fb.data || !ob.data) return <Card className="bg-teal-soft"><p className="text-sm font-bold">Finding your next challenge…</p></Card>;
  const r = nextChallenge({ games: a.content.games, done: a.done, tags: ob.data.tags }, fb.data);
  const g = r.game;
  return (
    <Card className="bg-teal-soft">
      <p className="text-sm font-extrabold uppercase tracking-wide">Recommended next</p>
      {g ? <>
        <p className="mt-1 text-xl font-extrabold">{g.title}{r.mode === "practice" ? " · practice" : r.mode === "harder" ? " · challenge mode" : ""}</p>
        <p className="text-sm">Level {g.level} · {a.content.levels.find((l) => l.n === g.level)?.concept}</p>
      </> : null}
      <p className="mt-2 text-sm">{r.message}</p>
      <p className="mt-1 text-xs font-bold text-muted-foreground">Why: {r.rule}</p>
      {g && <Link to="/play/$gameId" params={{ gameId: g.id }} search={{ mode: r.mode }} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-2xl chunky bg-coral px-5 font-extrabold text-primary-foreground"><Play className="size-5" /> Play</Link>}
    </Card>
  );
}
