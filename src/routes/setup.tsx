import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, DemoFunds, Loading } from "@/components/AppShell";
import { BigButton } from "@/components/game/Controls";
import { setDemo, todayISO, useDemo, useIsClient } from "@/lib/demo-store";
import { ageDefaultDifficulty, earnedTotal, eur, maxCost, validatePlan } from "@/lib/rewards";
import type { AgeBand, Difficulty } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Adult setup — Robot Builders" },
      { name: "description", content: "Set the age band, parent-funded rewards, level boosters, budget and the child's goal." },
      { property: "og:title", content: "Adult setup — Robot Builders" },
      { property: "og:description", content: "Plan parent-funded rewards and a savings goal (demo funds)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Setup,
});

const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const field = "mt-1 w-full rounded-xl border-2 border-navy bg-card px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-4 focus:ring-teal/40";

function Setup() {
  const client = useIsClient();
  const s = useDemo();
  const nav = useNavigate();
  const [f, setF] = useState({ childName: "", ageBand: null as AgeBand | null, difficulty: "gentle" as Difficulty, perGame: 2, booster: 5, budget: 55, goalName: "", goalTarget: 40, redeemDate: inDays(30) });
  const [touchedBudget, setTouchedBudget] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => {
    if (!client) return;
    setF((x) => ({ ...x, childName: s.childName, ageBand: s.ageBand, difficulty: s.difficulty, ...(s.plan ? { perGame: s.plan.perGame, booster: s.plan.booster, budget: s.plan.budget, goalName: s.plan.goalName, goalTarget: s.plan.goalTarget, redeemDate: s.plan.redeemDate } : {}) }));
    if (s.plan) setTouchedBudget(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);
  if (!client) return <Loading />;

  const cost = maxCost(f.perGame, f.booster);
  const budget = touchedBudget ? f.budget : cost;
  const locked = s.transactions.length > 0;
  const save = () => {
    const plan = { perGame: f.perGame, booster: f.booster, budget, goalName: f.goalName, goalTarget: f.goalTarget, redeemDate: f.redeemDate };
    const errs = validatePlan(s, plan, todayISO());
    if (!f.ageBand) errs.unshift("Choose an age band.");
    setErrors(errs);
    if (errs.length) return;
    setDemo((x) => ({ ...x, childName: f.childName.trim() || "Builder", ageBand: f.ageBand, difficulty: f.difficulty, plan: { ...plan, confirmedAt: new Date().toISOString() } }));
    nav({ to: "/adult" });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Adult setup</h1>
      <p className="mt-1 text-muted-foreground">A few choices, then the builder can start. You fund every reward; nobody else adds money.</p>
      <DemoFunds className="mt-4" />

      <Card className="mt-6 space-y-5">
        <h2 className="text-xl font-extrabold">1. About the builder</h2>
        <label className="block font-bold">Child's first name (optional)<input className={field} value={f.childName} onChange={(e) => setF({ ...f, childName: e.target.value })} placeholder="e.g. Sam" maxLength={30} /></label>
        <fieldset>
          <legend className="font-bold">Age band</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["10-12", "13-15"] as AgeBand[]).map((b) => (
              <button key={b} type="button" aria-pressed={f.ageBand === b} onClick={() => setF({ ...f, ageBand: b, difficulty: ageDefaultDifficulty(b) })} className={cn("rounded-2xl border-2 border-navy px-4 py-3 text-lg font-extrabold", f.ageBand === b ? "bg-teal text-secondary-foreground" : "bg-card")}>{b.replace("-", "–")} years</button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">We suggest explanation detail and starting difficulty from this. You can override it any time. The same five levels apply to everyone.</p>
        </fieldset>
        <fieldset>
          <legend className="font-bold">Starting difficulty {f.ageBand && <span className="font-semibold text-muted-foreground">(suggested: {ageDefaultDifficulty(f.ageBand) === "gentle" ? "Gentle" : "Challenge"})</span>}</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["gentle", "challenge"] as Difficulty[]).map((d) => (
              <button key={d} type="button" aria-pressed={f.difficulty === d} onClick={() => setF({ ...f, difficulty: d })} className={cn("rounded-2xl border-2 border-navy px-4 py-3 text-left", f.difficulty === d ? "bg-navy text-on-dark" : "bg-card")}>
                <span className="block font-extrabold">{d === "gentle" ? "Gentle" : "Challenge"}</span>
                <span className="text-sm">{d === "gentle" ? "More blocks allowed, fewer choices" : "Tighter block limits, stars, extra decoy blocks"}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className="mt-6 space-y-5">
        <h2 className="text-xl font-extrabold">2. Rewards you fund</h2>
        {locked && <p className="rounded-xl bg-mint px-3 py-2 text-sm font-bold">Rewards have already been earned ({eur(earnedTotal(s))}). You can raise amounts, but not lower them.</p>}
        <div>
          <p className="font-bold">Reward per game (first completion only)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {[1, 2, 5].map((v) => (
              <button key={v} type="button" aria-pressed={f.perGame === v} disabled={locked && v < (s.plan?.perGame ?? 0)} onClick={() => setF({ ...f, perGame: v })} className={cn("min-w-16 rounded-2xl border-2 border-navy px-4 py-2.5 text-lg font-extrabold disabled:opacity-40", f.perGame === v ? "bg-sun" : "bg-card")}>{eur(v)}</button>
            ))}
            <label className="flex items-center gap-2 text-sm font-bold">Custom €<input type="number" min={0.5} step={0.5} className={cn(field, "mt-0 w-24")} value={f.perGame} onChange={(e) => setF({ ...f, perGame: Number(e.target.value) })} /></label>
          </div>
        </div>
        <label className="block font-bold">Level booster (fixed €, once per completed level)
          <input type="number" min={0} step={1} className={cn(field, "w-40")} value={f.booster} onChange={(e) => setF({ ...f, booster: Number(e.target.value) })} />
        </label>
        <div className="rounded-2xl bg-sun-soft p-4">
          <p className="text-sm font-bold uppercase tracking-wide">Maximum cost</p>
          <p className="mt-1 font-mono text-lg">15 × {eur(f.perGame)} + 5 × {eur(f.booster)} = <strong className="text-2xl">{eur(cost)}</strong></p>
          <label className="mt-3 block font-bold">Total funded budget (must cover the maximum)
            <input type="number" min={cost} className={cn(field, "w-40")} value={budget} onChange={(e) => { setTouchedBudget(true); setF({ ...f, budget: Number(e.target.value) }); }} />
          </label>
          {budget < cost && <p className="mt-2 text-sm font-bold text-destructive">Budget is {eur(cost - budget)} short of the maximum cost.</p>}
        </div>
      </Card>

      <Card className="mt-6 space-y-5">
        <h2 className="text-xl font-extrabold">3. The builder's goal</h2>
        <label className="block font-bold">What are they saving for? (let the child choose)<input className={field} value={f.goalName} onChange={(e) => setF({ ...f, goalName: e.target.value })} placeholder="e.g. Skateboard, or 'savings'" maxLength={40} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block font-bold">Target amount (€)<input type="number" min={1} className={field} value={f.goalTarget} onChange={(e) => setF({ ...f, goalTarget: Number(e.target.value) })} /></label>
          <label className="block font-bold">Redemption date<input type="date" min={inDays(1)} className={field} value={f.redeemDate} onChange={(e) => setF({ ...f, redeemDate: e.target.value })} /></label>
        </div>
      </Card>

      {errors.length > 0 && (
        <ul role="alert" className="mt-6 space-y-1 rounded-2xl border-2 border-destructive bg-card p-4 text-sm font-bold text-destructive">{errors.map((e) => <li key={e}>• {e}</li>)}</ul>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <BigButton onClick={save} className="min-h-14 text-lg">Confirm plan · {eur(budget)} demo budget</BigButton>
        <span className="text-sm text-muted-foreground">No card or bank details are collected. Nothing is charged.</span>
      </div>
    </div>
  );
}
