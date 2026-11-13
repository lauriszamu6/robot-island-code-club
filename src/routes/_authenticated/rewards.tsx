import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Card, DemoFunds } from "@/components/AppShell";
import { GoalMeter } from "@/components/GoalMeter";
import { TxnHistory } from "@/components/History";
import { RobotSays } from "@/components/Robot";
import { WalletGate, type WithWallet } from "@/components/WalletGate";
import { todayISO } from "@/lib/demo-store";
import { nextOpenGame } from "@/lib/adventure-data";
import { euro } from "@/lib/wallet-data";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "My goal & rewards — Astrobit" },
      { name: "description", content: "Savings goal progress, earned game rewards and level boosters, and what's still available to earn." },
      { property: "og:title", content: "My goal & rewards — Astrobit" },
      { property: "og:description", content: "Goal progress and reward history (simulated money)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <WalletGate>{(x) => <Rewards x={x} />}</WalletGate>,
});

function Rewards({ x }: { x: WithWallet }) {
  const { wallet: w, sum, content, done, child } = x;
  if (!w.plan || !w.goal) return (
    <div className="mx-auto max-w-lg px-4 py-8"><Card className="text-center"><h1 className="text-2xl font-extrabold">No goal yet</h1><p className="mt-1 text-muted-foreground">Ask your adult to set up a reward plan and savings goal for {child.nickname}.</p><Link to="/setup" className="mt-3 inline-block font-bold text-teal underline">Adult: set up rewards</Link></Card></div>
  );
  const next = nextOpenGame(content.games, done);
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <h1 className="text-3xl font-extrabold">My goal & rewards</h1>
      <DemoFunds />
      <Card><GoalMeter w={w} sum={sum} /></Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm font-extrabold uppercase tracking-wide">My balance</p><p className="mt-1 font-mono text-2xl font-extrabold">{euro(sum.childBalance)}</p><p className="text-xs">earned and not yet handed over</p></Card>
        <Card><p className="text-sm font-extrabold uppercase tracking-wide">Next reward</p><p className="mt-1">{next && !w.goal.redeemed_at ? <><strong>{euro(w.plan.per_game_cents)}</strong> for “{next.title}”</> : "No more rewards in this plan"}</p></Card>
        <Card><p className="text-sm font-extrabold uppercase tracking-wide">Redemption date</p><p className="mt-1"><strong>{format(parseISO(w.goal.redeem_date), "d MMM yyyy")}</strong>{w.goal.redeemed_at ? " · redeemed" : todayISO() >= w.goal.redeem_date ? " · ask your adult!" : ""}</p></Card>
      </div>
      <Card>
        <h2 className="text-xl font-extrabold">Boosters, explained</h2>
        <p className="mt-1 text-sm">Each game pays {euro(w.plan.per_game_cents)} the first time you solve it. Finish all three games on an island and your adult's plan adds a one-time {euro(w.plan.booster_cents)} booster. Stars and workshop upgrades are decorations, not money.</p>
      </Card>
      <Card><h2 className="mb-2 text-xl font-extrabold">History</h2><TxnHistory txns={w.txns} games={content.games} showFunding={false} /></Card>
      <RobotSays mood="encourage">Money is a bonus. The real treasure is what you can build!</RobotSays>
    </div>
  );
}
