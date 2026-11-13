import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Lock, Play, RotateCcw, Rocket } from "lucide-react";
import { Card, DemoFunds, Loading, NeedsPlan } from "@/components/AppShell";
import { RobotSays } from "@/components/Robot";
import { SkyBackdrop } from "@/components/scenery/Sky";
import { IslandArt, ACCENT_BG } from "@/components/scenery/Island";
import { useDemo, useIsClient } from "@/lib/demo-store";
import { KIND_LABEL, gamesForLevel, levelByN } from "@/lib/game-data";
import { eur, levelStatus } from "@/lib/rewards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/level/$levelId")({
  loader: ({ params }) => {
    const level = levelByN(Number(params.levelId));
    if (!level) throw notFound();
    return { level };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Level ${loaderData.level.n}: ${loaderData.level.concept} — Robot Builders` : "Level — Robot Builders" },
      { name: "description", content: loaderData ? `Three ${loaderData.level.concept.toLowerCase()} games on a floating robot workshop island.` : "A Robot Builders level." },
      { property: "og:title", content: loaderData ? `Level ${loaderData.level.n}: ${loaderData.level.concept}` : "Robot Builders level" },
      { property: "og:description", content: "Three coding games on a floating robot workshop island." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LevelPage,
});

function LevelPage() {
  const { level } = Route.useLoaderData();
  const client = useIsClient();
  const s = useDemo();
  if (!client) return <Loading />;
  if (!s.plan) return <NeedsPlan role={s.role} />;
  const status = levelStatus(s, level.n);
  const games = gamesForLevel(level.n);
  const plan = s.plan;
  const boosterPaid = s.transactions.some((t) => t.id === `level:${level.n}`);

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

        <Card className="mt-6 bg-sun-soft">
          <div className="flex items-start gap-3">
            <Rocket className="mt-1 size-6 shrink-0 text-coral" />
            <div>
              <p className="font-extrabold">How rewards work on this island</p>
              <p className="text-sm">Each game pays <strong>{eur(s.plan.perGame)}</strong> the first time you solve it. Finish all three to get a one-time <strong>{eur(s.plan.booster)} level booster</strong>. {boosterPaid ? "You already earned this booster." : ""} Replays are just for fun: no extra money. Your adult funds every reward.</p>
              <DemoFunds className="mt-2 inline-flex" />
            </div>
          </div>
        </Card>

        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {games.map((g, i) => {
            const done = !!s.completed[g.id];
            const locked = status === "locked";
            return (
              <li key={g.id}>
                <Card className={cn("flex h-full flex-col", done && "bg-mint", locked && "opacity-70")}>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Game {i + 1} · {KIND_LABEL[g.def.kind]}</p>
                  <h2 className="mt-1 text-xl font-extrabold">{g.title}</h2>
                  <p className="mt-1 flex-1 text-sm">{g.goal}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold">
                    {done ? <><CheckCircle2 className="size-4" /> Completed · {eur(plan.perGame)} earned</> : locked ? <><Lock className="size-4" /> Locked</> : <>Not started · worth {eur(plan.perGame)}</>}
                  </p>
                  {!locked && (
                    <Link to="/play/$gameId" params={{ gameId: g.id }} search={{ mode: "normal" }} className={cn("mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl chunky font-extrabold", done ? "bg-card" : "bg-coral text-primary-foreground")}>
                      {done ? <><RotateCcw className="size-5" /> Replay (no reward)</> : <><Play className="size-5" /> Play</>}
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
