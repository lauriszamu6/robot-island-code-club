import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock } from "lucide-react";
import { Card, DemoFunds, Loading, NeedsPlan } from "@/components/AppShell";
import { BigButton } from "@/components/game/Controls";
import { Robot } from "@/components/Robot";
import { setDemo, todayISO, useDemo, useIsClient } from "@/lib/demo-store";
import { applyRedemption, canRedeem, earnedTotal, eur } from "@/lib/rewards";

export const Route = createFileRoute("/_authenticated/redeem")({
  head: () => ({
    meta: [
      { title: "Mock redemption — Astrobit" },
      { name: "description", content: "Adult-controlled mock redemption of earned demo rewards, available on or after the chosen date." },
      { property: "og:title", content: "Mock redemption — Astrobit" },
      { property: "og:description", content: "Simulated, adult-controlled redemption. No real money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Redeem,
});

function Redeem() {
  const client = useIsClient();
  const s = useDemo();
  const [confirming, setConfirming] = useState(false);
  if (!client) return <Loading />;
  if (!s.plan) return <NeedsPlan role={s.role} />;
  const today = todayISO();
  const eligible = canRedeem(s, today);
  const earned = earnedTotal(s);

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Mock redemption</h1>
      <DemoFunds />
      {s.role !== "adult" && <p className="rounded-xl bg-lavender-soft p-3 text-sm font-bold">Redemption is controlled by the adult. Switch to the adult role to continue.</p>}
      <Card className="shadow-none">
        {s.redemption ? (
          <div className="text-center">
            <Robot mood="celebrate" className="mx-auto h-28 w-24" />
            <p className="mt-2 flex items-center justify-center gap-2 text-xl font-extrabold"><CheckCircle2 className="text-teal" /> Redeemed (simulated)</p>
            <p className="mt-1">{eur(s.redemption.amount)} marked as handed over on {format(parseISO(s.redemption.at), "d MMM yyyy, HH:mm")}.</p>
            <p className="mt-2 text-sm text-muted-foreground">No payment happened. In the real product, this would be your payout step. This plan can't be redeemed twice.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p><strong>Goal:</strong> {s.plan.goalName}</p>
            <p><strong>Earned so far:</strong> {eur(earned)}</p>
            <p className="flex items-center gap-2"><Clock className="size-4" /><strong>Eligible from:</strong> {format(parseISO(s.plan.redeemDate), "d MMMM yyyy")}</p>
            {!eligible && <p className="rounded-xl bg-sun-soft p-3 text-sm font-bold">{earned === 0 ? "Nothing earned yet." : `Not yet. Redemption opens on ${format(parseISO(s.plan.redeemDate), "d MMM yyyy")}.`}</p>}
            {eligible && s.role === "adult" && !confirming && <BigButton onClick={() => setConfirming(true)}>Redeem {eur(earned)} (simulated)</BigButton>}
            {confirming && (
              <div className="rounded-2xl border-2 border-navy p-4">
                <p className="font-bold">Confirm you've handed over {eur(earned)} for “{s.plan.goalName}” outside the app?</p>
                <p className="text-sm text-muted-foreground">This is a simulation. No card or bank details are used.</p>
                <div className="mt-3 flex gap-2">
                  <BigButton onClick={() => { setDemo((x) => applyRedemption(x, new Date().toISOString(), todayISO())); setConfirming(false); }}>Confirm (demo)</BigButton>
                  <BigButton variant="plain" onClick={() => setConfirming(false)}>Cancel</BigButton>
                </div>
              </div>
            )}
            {!eligible && earned > 0 && s.role === "adult" && (
              <p className="text-xs text-muted-foreground">Demo tip: to try the flow now, set an earlier date in <Link to="/setup" className="underline">plan setup</Link>. Dates must be in the future, so the earliest is tomorrow.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
