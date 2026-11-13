import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Lock, Play, RotateCcw, Rocket } from "lucide-react";
import { Card, DemoFunds } from "@/components/AppShell";
import { AdventureGate, type Adventure } from "@/components/AdventureGate";
import { RobotSays } from "@/components/Robot";
import { SkyBackdrop } from "@/components/scenery/Sky";
import { IslandArt, ACCENT_BG } from "@/components/scenery/Island";
import { useDemo } from "@/lib/demo-store";
import { KIND_LABEL } from "@/lib/game-data";
import { levelState } from "@/lib/adventure-data";
import { eur } from "@/lib/rewards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/level/$levelId")({
  head: ({ params }) => ({
    meta: [
      { title: `Level ${params.levelId} — Astrobit` },
      { name: "description", content: "Three coding games on a floating robot workshop island." },
      { property: "og:title", content: `Astrobit level ${params.levelId}` },
      { property: "og:description", content: "Three coding games on a floating robot workshop island." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LevelPage,
});

function LevelPage() {
  const { levelId } = Route.useParams();
  return <AdventureGate>{(a) => <LevelView a={a} n={Number(levelId)} />}</AdventureGate>;
}

function LevelView({ a, n }: { a: Adventure; n: number }) {
  const s = useDemo();
  const level = a.content.levels.find((l) => l.n === n);
  if (!level) return <div className="mx-auto max-w-lg p-6"><Card className="text-center"><h1 className="text-2xl font-extrabold">Island not found</h1><Link to="/map" className="mt-3 inline-block font-extrabold text-teal underline">Back to the map</Link></Card></div>;
  const games = a.content.games.filter((g) => g.level === n);
  const status = levelState(a.content.games, a.done, n);
  const plan = s.plan;
  const progress = new Map(a.progress.map((p) => [p.game_id, p]));

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <SkyBackdrop />
      <div className="relative mx-auto max-w-4xl px-4 py-6 anim-enter">
        <Link to="/map" className="inline-flex items-center gap-1 font-extrabold text-teal"><ArrowLeft className="size-4" /> Island map</Link>
        <div className="mt-4 grid items-center gap-6 md:grid-cols-[260px_1fr]">
          <IslandArt accent={level.accent} status={status} className="mx-auto w-56 md:w-full" />
          <div>
            <span className={cn("inline-block rounded-full border-2 border-navy px-3 py-0.5 text-sm font-extrabold", ACCENT_BG[level.accent])}>Level {level.n}</span>
            <h1 className="mt-2 text-4xl font-extrabold">{level.concept}</h1>
            <p className="text-lg">{level.tagline}</p>
            <p className="mt-2 text-sm font-bold">{status === "locked" ? <><Lock className="inline size-4" /> Locked: finish level {level.n - 1} first.</> : status === "completed" ? <><CheckCircle2 className="inline size-4" /> Completed · upgrade earned: {level.upgrade}</> : "Open: finish all three games to unlock the next island."}</p>
          </div>
        </div>

        {plan && (
          <Card className="mt-6 bg-sun-soft">
            <div className="flex items-start gap-3">
              <Rocket className="mt-1 size-6 shrink-0 text-coral" />
              <div>
                <p className="font-extrabold">How rewards work on this island</p>
                <p className="text-sm">Each game pays <strong>{eur(plan.perGame)}</strong> the first time you solve it. Finish all three to get a one-time <strong>{eur(plan.booster)} level booster</strong>. Replays are just for fun: no extra money. Your adult funds every reward.</p>
                <DemoFunds className="mt-2 inline-flex" />
              </div>
            </div>
          </Card>
        )}

        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {games.map((g, i) => {
            const p = progress.get(g.id);
            const done = p?.status === "completed";
            const locked = status === "locked";
            return (
              <li key={g.id}>
                <Card className={cn("flex h-full flex-col", done && "bg-mint", locked && "opacity-70")}>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Game {i + 1} · {KIND_LABEL[g.def.kind]}</p>
                  <h2 className="mt-1 text-xl font-extrabold">{g.title}</h2>
                  <p className="mt-1 flex-1 text-sm">{g.goal}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold">
                    {done ? <><CheckCircle2 className="size-4" /> Completed</> : locked ? <><Lock className="size-4" /> Locked</> : p ? <>In progress · {p.attempts} tr{p.attempts === 1 ? "y" : "ies"}</> : <>Not started</>}
                  </p>
                  {!locked && (
                    <Link to="/play/$gameId" params={{ gameId: g.id }} search={{ mode: "normal" }} className={cn("mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl chunky font-extrabold", done ? "bg-card" : "bg-coral text-primary-foreground")}>
                      {done ? <><RotateCcw className="size-5" /> Replay</> : <><Play className="size-5" /> Play</>}
                    </Link>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
        <RobotSays mood="encourage" className="mt-8">Stuck is normal. Hints are always there, and they never cost anything.</RobotSays>
      </div>
    </div>
  );
}
