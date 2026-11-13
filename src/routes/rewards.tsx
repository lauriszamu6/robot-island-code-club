import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Card, DemoFunds, Loading, NeedsPlan } from "@/components/AppShell";
import { GoalMeter } from "@/components/GoalMeter";
import { TxnHistory } from "@/components/History";
import { RobotSays } from "@/components/Robot";
import { useDemo, useIsClient, todayISO } from "@/lib/demo-store";
import { eur } from "@/lib/rewards";
import { nextGame } from "@/lib/recommend";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "My goal & rewards — Robot Builders" },
      { name: "description", content: "Savings goal progress, earned game rewards and level boosters, and what's still available to earn." },
      { property: "og:title", content: "My goal & rewards — Robot Builders" },
      { property: "og:description", content: "Goal progress and reward history (demo funds)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Rewards,
});

function Rewards() {
  const client = useIsClient();
  const s = useDemo();
  if (!client) return <Loading />;
  if (!s.plan) return <NeedsPlan role={s.role} />;
  const next = nextGame(s);
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <h1 className="text-3xl font-extrabold">My goal & rewards</h1>
      <DemoFunds />
      <Card><GoalMeter s={s} /></Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><p className="text-sm font-extrabold uppercase tracking-wide">Next reward</p><p className="mt-1">{next ? <><strong>{eur(s.plan.perGame)}</strong> for “{next.title}”</> : "All rewards earned!"}</p></Card>
        <Card><p className="text-sm font-extrabold uppercase tracking-wide">Redemption date</p><p className="mt-1"><strong>{format(parseISO(s.plan.redeemDate), "EEEE d MMMM yyyy")}</strong>{s.redemption ? " · already redeemed" : todayISO() >= s.plan.redeemDate ? " · ask your adult to redeem!" : ""}</p></Card>
      </div>
      <Card>
        <h2 className="text-xl font-extrabold">Boosters, explained</h2>
        <p className="mt-1 text-sm">Each game pays {eur(s.plan.perGame)} the first time you solve it. Finish all three games on an island and your adult adds a one-time {eur(s.plan.booster)} booster. Stars and workshop upgrades are decorations, not money.</p>
      </Card>
      <Card><h2 className="mb-2 text-xl font-extrabold">History</h2><TxnHistory s={s} /></Card>
      <RobotSays mood="encourage">Money is a bonus. The real treasure is what you can build!</RobotSays>
    </div>
  );
}
