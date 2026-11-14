import { VerifyGate } from "@/components/VerifyGate";
import { AdultGate } from "@/components/AdultGate";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, DemoFunds } from "@/components/AppShell";
import { WalletGate, type WithWallet } from "@/components/WalletGate";
import { BigButton } from "@/components/game/Controls";
import { todayISO } from "@/lib/demo-store";
import { euro, maxCostCents, saveRewardPlan, toCents } from "@/lib/wallet-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/setup")({
  head: () => ({
    meta: [
      { title: "Reward plan — Astrobit" },
      { name: "description", content: "Set parent-funded rewards, level boosters, budget and the child's savings goal (simulated money)." },
      { property: "og:title", content: "Reward plan — Astrobit" },
      { property: "og:description", content: "Plan parent-funded rewards and a savings goal (simulated money)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AdultGate><VerifyGate><WalletGate>{(x) => <Setup x={x} />}</WalletGate></VerifyGate></AdultGate>,
});

const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const field = "mt-1 w-full rounded-xl border-2 border-navy bg-card px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-4 focus:ring-teal/40";

function Setup({ x }: { x: WithWallet }) {
  const { wallet: w, sum, child, content } = x;
  const nav = useNavigate();
  const qc = useQueryClient();
  // Form works in euros; everything is stored in cents.
  const [f, setF] = useState({
    perGame: w.plan ? w.plan.per_game_cents / 100 : 2,
    booster: w.plan ? w.plan.booster_cents / 100 : 5,
    goalName: w.goal?.name ?? "",
    goalTarget: w.goal ? w.goal.target_cents / 100 : 40,
    redeemDate: w.goal && w.goal.redeem_date > todayISO() ? w.goal.redeem_date : inDays(30),
  });
  const [budgetEur, setBudgetEur] = useState<number | null>(w.plan ? w.plan.budget_cents / 100 : null);
  const [confirming, setConfirming] = useState(false);
  const pg = toCents(f.perGame), bo = toCents(f.booster);
  const cost = maxCostCents(pg, bo, content.games.length, content.levels.length);
  const budget = Math.max(budgetEur === null ? cost : toCents(budgetEur), 0);
  const earnedLock = sum.earned > 0;
  const redeemed = !!w.goal?.redeemed_at;

  const save = useMutation({
    mutationFn: () => saveRewardPlan(child.id, { perGame: pg, booster: bo, budget, goalName: f.goalName, goalTarget: toCents(f.goalTarget), redeemDate: f.redeemDate }),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["wallet", child.id] }); nav({ to: "/adult" }); },
  });
  const localErrors = [
    budget < cost && `Budget is ${euro(cost - budget)} short of the maximum cost.`,
    w.plan && budget < w.plan.budget_cents && "The funded budget can't be reduced.",
    earnedLock && w.plan && (pg < w.plan.per_game_cents || bo < w.plan.booster_cents) && "Rewards can't be lowered after money has been earned.",
    !f.goalName.trim() && "Add the goal name.",
    !(f.goalTarget > 0) && "Add a target amount.",
    f.redeemDate <= todayISO() && "Pick a redemption date in the future.",
  ].filter(Boolean) as string[];

  if (redeemed) return <div className="mx-auto max-w-xl px-4 py-8"><Card><h1 className="text-2xl font-extrabold">This plan has been redeemed</h1><p className="mt-1 text-muted-foreground">{child.nickname}'s simulated rewards were handed over. A new plan for future content will come later.</p></Card></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Reward plan for {child.nickname}</h1>
      <p className="mt-1 text-muted-foreground">You fund every game reward and every level booster. Nobody else adds money.</p>
      <DemoFunds className="mt-4" />

      <Card className="mt-6 space-y-5">
        <h2 className="text-xl font-extrabold">1. Rewards you fund</h2>
        {earnedLock && <p className="rounded-xl bg-mint px-3 py-2 text-sm font-bold">{euro(sum.earned)} has already been earned. You can raise amounts, but not lower them.</p>}
        <div>
          <p className="font-bold">Reward per game (first completion only)</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {[1, 2, 5].map((v) => (
              <button key={v} type="button" aria-pressed={f.perGame === v} disabled={earnedLock && toCents(v) < (w.plan?.per_game_cents ?? 0)} onClick={() => setF({ ...f, perGame: v })} className={cn("min-w-16 rounded-2xl border-2 border-navy px-4 py-2.5 text-lg font-extrabold disabled:opacity-40", f.perGame === v ? "bg-sun" : "bg-card")}>€{v}</button>
            ))}
            <label className="flex items-center gap-2 text-sm font-bold">Custom €<input type="number" min={0.5} step={0.5} className={cn(field, "mt-0 w-24")} value={f.perGame} onChange={(e) => setF({ ...f, perGame: Number(e.target.value) })} /></label>
          </div>
        </div>
        <label className="block font-bold">Level booster (fixed €, paid once per completed level)
          <input type="number" min={0} step={1} className={cn(field, "w-40")} value={f.booster} onChange={(e) => setF({ ...f, booster: Number(e.target.value) })} />
        </label>
        <div className="rounded-2xl bg-sun-soft p-4">
          <p className="text-sm font-bold uppercase tracking-wide">Maximum commitment</p>
          <p className="mt-1 font-mono text-lg">{content.games.length} × {euro(pg)} + {content.levels.length} × {euro(bo)} = <strong className="text-2xl">{euro(cost)}</strong></p>
          <label className="mt-3 block font-bold">Total funded budget (€, must cover the maximum)
            <input type="number" min={cost / 100} className={cn(field, "w-40")} value={budget / 100} onChange={(e) => setBudgetEur(Number(e.target.value))} />
          </label>
        </div>
      </Card>

      <Card className="mt-6 space-y-5">
        <h2 className="text-xl font-extrabold">2. {child.nickname}'s savings goal</h2>
        <label className="block font-bold">What are they saving for? (let the child choose)<input className={field} value={f.goalName} onChange={(e) => setF({ ...f, goalName: e.target.value })} placeholder="e.g. Skateboard" maxLength={40} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block font-bold">Target amount (€)<input type="number" min={1} className={field} value={f.goalTarget} onChange={(e) => setF({ ...f, goalTarget: Number(e.target.value) })} /></label>
          <label className="block font-bold">Redemption date<input type="date" min={inDays(1)} className={field} value={f.redeemDate} onChange={(e) => setF({ ...f, redeemDate: e.target.value })} /></label>
        </div>
      </Card>

      {(localErrors.length > 0 || save.error) && (
        <ul role="alert" className="mt-6 space-y-1 rounded-2xl border-2 border-destructive bg-card p-4 text-sm font-bold text-destructive">
          {localErrors.map((e) => <li key={e}>• {e}</li>)}
          {save.error && <li>• {save.error.message}</li>}
        </ul>
      )}

      {!confirming ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <BigButton onClick={() => setConfirming(true)} disabled={localErrors.length > 0} className="min-h-14 text-lg">Review plan</BigButton>
          <span className="text-sm text-muted-foreground">No card or bank details are collected. Nothing is charged.</span>
        </div>
      ) : (
        <Card className="mt-6 bg-sun-soft">
          <h2 className="text-xl font-extrabold">Confirm the simulated plan</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Game reward: <strong>{euro(pg)}</strong> × {content.games.length} games</li>
            <li>Level booster: <strong>{euro(bo)}</strong> × {content.levels.length} levels</li>
            <li>Maximum commitment: <strong>{euro(cost)}</strong></li>
            <li>Budget you're funding: <strong>{euro(budget)}</strong>{w.plan && budget > sum.funded && <> (adds {euro(budget - sum.funded)})</>}</li>
          </ul>
          <DemoFunds className="mt-3" />
          <div className="mt-4 flex gap-2">
            <BigButton onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Confirm (demo)"}</BigButton>
            <BigButton variant="plain" onClick={() => setConfirming(false)}>Back</BigButton>
          </div>
        </Card>
      )}
    </div>
  );
}
