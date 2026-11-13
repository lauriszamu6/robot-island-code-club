import { PiggyBank } from "lucide-react";
import type { DemoState } from "@/lib/rewards";
import { earnedBy, earnedTotal, eur, remainingToEarn } from "@/lib/rewards";

export function GoalMeter({ s, compact }: { s: DemoState; compact?: boolean }) {
  if (!s.plan) return null;
  const earned = earnedTotal(s);
  const pct = Math.min(100, Math.round((earned / s.plan.goalTarget) * 100));
  return (
    <div>
      <div className="flex items-center gap-2">
        <PiggyBank className="size-6 text-coral" />
        <p className="font-extrabold">Goal: {s.plan.goalName}</p>
        <span className="ml-auto font-mono text-sm font-bold">{eur(earned)} / {eur(s.plan.goalTarget)}</span>
      </div>
      <div className="mt-2 h-6 overflow-hidden rounded-full border-2 border-navy bg-cream" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Goal progress">
        <div className="h-full bg-sun transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-sm font-bold">{pct}% of goal</p>
      {!compact && (
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-mint p-2"><dt className="font-bold">Earned so far</dt><dd className="font-mono text-lg font-extrabold">{eur(earned)}</dd><dd className="text-xs">games {eur(earnedBy(s, "game"))} · boosters {eur(earnedBy(s, "booster"))}</dd></div>
          <div className="rounded-xl border-2 border-dashed border-navy/40 p-2"><dt className="font-bold">Still available to earn</dt><dd className="font-mono text-lg font-extrabold">{eur(remainingToEarn(s))}</dd><dd className="text-xs">not yours yet, earn it by playing</dd></div>
        </dl>
      )}
    </div>
  );
}
