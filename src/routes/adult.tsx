import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Card, DemoFunds, Loading, NeedsPlan } from "@/components/AppShell";
import { TxnHistory } from "@/components/History";
import { CharacterApiTest } from "@/components/CharacterApiTest";
import { setDemo, useDemo, useIsClient } from "@/lib/demo-store";
import { GAMES, LEVELS, type Difficulty } from "@/lib/game-data";
import { completedCount, earnedBy, earnedTotal, eur, levelStatus } from "@/lib/rewards";
import { observations } from "@/lib/recommend";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/adult")({
  head: () => ({
    meta: [
      { title: "Adult dashboard — Robot Builders" },
      { name: "description", content: "Calm overview of progress, learning observations, ratings, hints and the reward budget." },
      { property: "og:title", content: "Adult dashboard — Robot Builders" },
      { property: "og:description", content: "Learning observations and reward budget (demo funds)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Adult,
});

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-2xl border-2 border-navy/20 bg-card p-4"><p className="text-sm font-bold text-muted-foreground">{label}</p><p className="font-mono text-2xl font-extrabold">{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>;
}

function Adult() {
  const client = useIsClient();
  const s = useDemo();
  if (!client) return <Loading />;
  if (!s.plan) return <NeedsPlan role="adult" />;
  const earned = earnedTotal(s);
  const obs = observations(s);
  const hintsTotal = Object.values(s.hints).reduce((a, b) => a + b, 0);
  const replaysTotal = Object.values(s.replays).reduce((a, b) => a + b, 0);
  const List = ({ items, empty }: { items: string[]; empty: string }) => items.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end gap-3">
        <div><h1 className="text-3xl font-extrabold">Adult dashboard</h1><p className="text-muted-foreground">{s.childName || "Builder"} · age {s.ageBand?.replace("-", "–")} · {completedCount(s)} of 15 games complete</p></div>
        <Link to="/setup" className="ml-auto rounded-xl border-2 border-navy bg-card px-4 py-2 font-bold">Edit plan</Link>
        <Link to="/redeem" className="rounded-xl border-2 border-navy bg-coral px-4 py-2 font-bold text-primary-foreground">Redemption</Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Budget</h2>
        <DemoFunds />
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Funded" value={eur(s.plan.budget)} sub={`Max cost: 15 × ${eur(s.plan.perGame)} + 5 × ${eur(s.plan.booster)}`} />
          <Stat label="Earned by child" value={eur(earned)} sub={`Games ${eur(earnedBy(s, "game"))} · Boosters ${eur(earnedBy(s, "booster"))}`} />
          <Stat label="Remaining unearned" value={eur(s.plan.budget - earned)} sub={`Goal: ${s.plan.goalName} (${eur(s.plan.goalTarget)}) · redeem from ${format(parseISO(s.plan.redeemDate), "d MMM yyyy")}`} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <h2 className="text-lg font-extrabold">Completion</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {LEVELS.map((l) => {
              const st = levelStatus(s, l.n);
              const n = GAMES.filter((g) => g.level === l.n && s.completed[g.id]).length;
              return <li key={l.n} className="flex justify-between"><span>Level {l.n}: {l.concept}</span><span className="font-bold">{n}/3 · {st === "completed" ? "✓ Completed" : st === "locked" ? "🔒 Locked" : "Open"}</span></li>;
            })}
          </ul>
        </Card>
        <Card className="shadow-none"><h2 className="text-lg font-extrabold">Ratings (child's own words)</h2><div className="mt-2"><List items={[...obs.ratings, ...obs.hardRatings.map((t) => `Said “${t}” felt too hard`)]} empty="No ratings yet." /></div></Card>
        <Card className="shadow-none"><h2 className="text-lg font-extrabold">Hints used · {hintsTotal}</h2><div className="mt-2"><List items={obs.hints} empty="No hints used yet." /></div></Card>
        <Card className="shadow-none"><h2 className="text-lg font-extrabold">Voluntary replays · {replaysTotal}</h2><div className="mt-2"><List items={obs.replays} empty="No replays yet." /></div></Card>
      </section>
      <p className="text-sm text-muted-foreground">These are observations, not a score. Rewards encourage finishing; they aren't evidence of interest or talent. Look at ratings and voluntary replays together, and talk about it.</p>

      <Card className="shadow-none">
        <h2 className="text-lg font-extrabold">Difficulty</h2>
        <p className="text-sm text-muted-foreground">Suggested from the age band. Override anytime; the five levels stay the same.</p>
        <div className="mt-2 flex gap-2">
          {(["gentle", "challenge"] as Difficulty[]).map((d) => (
            <button key={d} aria-pressed={s.difficulty === d} onClick={() => setDemo((x) => ({ ...x, difficulty: d }))} className={cn("rounded-xl border-2 border-navy px-4 py-2 font-bold", s.difficulty === d ? "bg-navy text-on-dark" : "bg-card")}>{d === "gentle" ? "Gentle" : "Challenge"}</button>
          ))}
        </div>
      </Card>

      <Card className="shadow-none"><h2 className="mb-2 text-lg font-extrabold">Transaction history</h2><TxnHistory s={s} /></Card>
      <Card className="shadow-none"><h2 className="text-lg font-extrabold">Optional: character API test</h2><CharacterApiTest /></Card>
    </div>
  );
}
