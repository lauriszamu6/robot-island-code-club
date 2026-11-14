import { AdultGate } from "@/components/AdultGate";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Card, DemoFunds } from "@/components/AppShell";
import { AdventureGate, type Adventure } from "@/components/AdventureGate";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { levelState } from "@/lib/adventure-data";
import { TxnHistory } from "@/components/History";
import { TopUpCard } from "@/components/TopUpCard";
import { CharacterApiTest } from "@/components/CharacterApiTest";
import { useDemo } from "@/lib/demo-store";
import type { Difficulty } from "@/lib/game-data";
import { euro, summarize, walletQuery } from "@/lib/wallet-data";
import { observations } from "@/lib/recommend";
import { feedbackQuery, objectivesQuery } from "@/lib/insights-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/adult")({
  head: () => ({
    meta: [
      { title: "Adult dashboard — Astrobit" },
      { name: "description", content: "Calm overview of progress, learning observations, ratings, hints and the reward budget." },
      { property: "og:title", content: "Adult dashboard — Astrobit" },
      { property: "og:description", content: "Learning observations and reward budget (demo funds)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AdultGate><Adult /></AdultGate>,
});

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-2xl border-2 border-navy/20 bg-card p-4"><p className="text-sm font-bold text-muted-foreground">{label}</p><p className="font-mono text-2xl font-extrabold">{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>;
}

function Adult() {
  return <AdventureGate>{(a) => <AdultView a={a} />}</AdventureGate>;
}

function AdultView({ a }: { a: Adventure }) {
  const s = useDemo();
  const qc = useQueryClient();
  const setDifficulty = useMutation({
    mutationFn: async (d: Difficulty) => {
      const { error } = await supabase.from("child_profiles").update({ difficulty: d }).eq("id", a.child.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["children"] }),
  });
  const { levels, games } = a.content;
  const wq = useQuery(walletQuery(a.child.id));
  const w = wq.data;
  const sum = w ? summarize(w, games, levels, a.done) : null;
  const fbq = useQuery(feedbackQuery(a.child.id));
  const obq = useQuery(objectivesQuery);
  const fbRows = fbq.data ?? [];
  const obs = observations(games, obq.data?.list ?? [], obq.data?.tags ?? {}, fbRows, a.progress);
  const hintsTotal = fbRows.reduce((n, f) => n + f.hints_used, 0);
  const replaysTotal = a.progress.reduce((n, p) => n + p.replays, 0);
  const objTitle = (code: string) => obq.data?.list.find((o) => o.code === code)?.title ?? code;
  const List = ({ items, empty }: { items: string[]; empty: string }) => items.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end gap-3">
        <div><h1 className="text-3xl font-extrabold">Adult dashboard</h1><p className="text-muted-foreground">{a.child.nickname} · age {a.child.age_range.replace("-", "–")} · {a.done.size} of {games.length} games complete</p></div>
        <Link to="/setup" className="ml-auto rounded-xl border-2 border-navy bg-card px-4 py-2 font-bold">Edit plan</Link>
        <Link to="/redeem" className="rounded-xl border-2 border-navy bg-coral px-4 py-2 font-bold text-primary-foreground">Redemption</Link>
      </div>

      <TopUpCard childId={a.child.id} nickname={a.child.nickname} />

      {wq.error ? (
        <Card className="shadow-none"><p className="font-bold">Couldn't load the reward plan.</p><button className="text-sm font-bold text-teal underline" onClick={() => wq.refetch()}>Try again</button></Card>
      ) : !w || !sum ? <Card className="shadow-none"><p className="text-sm">Loading rewards…</p></Card> : w.plan && w.goal ? (
      <section className="space-y-3">
        <h2 className="text-xl font-extrabold">Budget</h2>
        <DemoFunds />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Parent funds available" value={euro(sum.parentAvailable)} sub={`Funded ${euro(sum.funded)} · max cost ${games.length} × ${euro(w.plan.per_game_cents)} + ${levels.length} × ${euro(w.plan.booster_cents)}`} />
          <Stat label="Child's earned balance" value={euro(sum.childBalance)} sub={`Games ${euro(sum.gameEarned)} · Boosters ${euro(sum.boosterEarned)}${sum.redeemed ? ` · redeemed ${euro(sum.redeemed)}` : ""}`} />
          <Stat label="Potential future rewards" value={euro(sum.potential)} sub="If every remaining game and level is finished" />
          <Stat label="Savings goal" value={euro(w.goal.target_cents)} sub={`${w.goal.name} · redeem from ${format(parseISO(w.goal.redeem_date), "d MMM yyyy")}`} />
        </div>
      </section>
      ) : (
        <Card className="shadow-none"><h2 className="text-lg font-extrabold">Rewards not set up</h2><p className="text-sm text-muted-foreground">Create a simulated reward plan for {a.child.nickname}.</p><Link to="/setup" className="mt-2 inline-block font-bold text-teal underline">Set up rewards</Link></Card>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <h2 className="text-lg font-extrabold">Completion</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {levels.map((l) => {
              const st = levelState(games, a.done, l.n);
              const n = games.filter((g) => g.level === l.n && a.done.has(g.id)).length;
              return <li key={l.n} className="flex justify-between"><span>Level {l.n}: {l.concept}</span><span className="font-bold">{n}/3 · {st === "completed" ? "✓ Completed" : st === "locked" ? "🔒 Locked" : "Open"}</span></li>;
            })}
          </ul>
        </Card>
        {(fbq.error || obq.error) && <Card className="shadow-none"><p className="font-bold">Couldn't load ratings.</p><button className="text-sm font-bold text-teal underline" onClick={() => { fbq.refetch(); obq.refetch(); }}>Try again</button></Card>}
        <Card className="shadow-none"><h2 className="text-lg font-extrabold">Recent ratings · {fbRows.length}</h2><div className="mt-2"><List items={fbRows.slice(-5).reverse().map((f) => `${games.find((g) => g.id === f.game_id)?.title}: ${f.fun === "loved" ? "loved it" : f.fun === "okay" ? "okay" : "not for me"}, ${f.difficulty.replace("_", " ")} (${(obq.data?.tags[f.game_id] ?? []).map(objTitle).join(", ")})`)} empty={fbq.isLoading ? "Loading…" : "No ratings yet. Suggestions will follow the normal order."} /></div></Card>
        <Card className="shadow-none"><h2 className="text-lg font-extrabold">Ratings (child's own words)</h2><div className="mt-2"><List items={[...obs.ratings, ...obs.hardRatings.map((t) => `Said “${t}” felt too hard`)]} empty="No ratings yet." /></div></Card>
        <Card className="shadow-none"><h2 className="text-lg font-extrabold">Hints used · {hintsTotal}</h2><div className="mt-2"><List items={obs.hints} empty="No hints used yet." /></div></Card>
        <Card className="shadow-none"><h2 className="text-lg font-extrabold">Voluntary replays · {replaysTotal}</h2><div className="mt-2"><List items={obs.replays} empty="No replays yet." /></div></Card>
      </section>
      <p className="text-sm text-muted-foreground">These are observations, not a score. Rewards encourage finishing; they aren't evidence of interest or talent. Look at ratings and voluntary replays together, and talk about it.</p>

      <Card className="shadow-none">
        <h2 className="text-lg font-extrabold">Difficulty for {a.child.nickname}</h2>
        <p className="text-sm text-muted-foreground">Suggested from the age band. Override anytime; the five levels stay the same.</p>
        <div className="mt-2 flex gap-2">
          {(["gentle", "challenge"] as Difficulty[]).map((d) => (
            <button key={d} aria-pressed={a.child.difficulty === d} disabled={setDifficulty.isPending} onClick={() => setDifficulty.mutate(d)} className={cn("rounded-xl border-2 border-navy px-4 py-2 font-bold", a.child.difficulty === d ? "bg-navy text-on-dark" : "bg-card")}>{d === "gentle" ? "Gentle" : "Challenge"}</button>
          ))}
        </div>
      </Card>

      <Card className="shadow-none"><h2 className="mb-2 text-lg font-extrabold">Transaction history</h2>{w ? <TxnHistory txns={w.txns} games={games} /> : <p className="text-sm">Loading…</p>}</Card>
      <Card className="shadow-none"><h2 className="text-lg font-extrabold">Optional: character API test</h2><CharacterApiTest /></Card>
    </div>
  );
}
