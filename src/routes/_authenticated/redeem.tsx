import { AdultGate } from "@/components/AdultGate";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock } from "lucide-react";
import { Card, DemoFunds } from "@/components/AppShell";
import { WalletGate, type WithWallet } from "@/components/WalletGate";
import { BigButton } from "@/components/game/Controls";
import { Robot } from "@/components/Robot";
import { todayISO } from "@/lib/demo-store";
import { euro, redeemGoal } from "@/lib/wallet-data";

export const Route = createFileRoute("/_authenticated/redeem")({
  head: () => ({
    meta: [
      { title: "Simulated redemption — Astrobit" },
      { name: "description", content: "Adult-controlled simulated redemption of earned rewards, available on or after the chosen date." },
      { property: "og:title", content: "Simulated redemption — Astrobit" },
      { property: "og:description", content: "Simulated, adult-controlled redemption. No real money." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AdultGate><WalletGate>{(x) => <Redeem x={x} />}</WalletGate></AdultGate>,
});

function Redeem({ x }: { x: WithWallet }) {
  const qc = useQueryClient();
  const { wallet: w, sum, child } = x;
  const [confirming, setConfirming] = useState(false);
  const redeem = useMutation({
    mutationFn: () => redeemGoal(child.id),
    onSuccess: () => { setConfirming(false); qc.invalidateQueries({ queryKey: ["wallet", child.id] }); },
  });
  const goal = w.goal;
  const redemption = w.txns.find((t) => t.kind === "redemption");
  const eligible = !!goal && !goal.redeemed_at && sum.earned > 0 && todayISO() >= goal.redeem_date;

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Simulated redemption</h1>
      <DemoFunds />
      {!goal ? (
        <Card><p className="font-bold">No savings goal yet for {child.nickname}.</p><Link to="/setup" className="mt-2 inline-block font-bold text-teal underline">Set up rewards</Link></Card>
      ) : (
        <>
          <Card className="shadow-none">
            {goal.redeemed_at && redemption ? (
              <div className="text-center">
                <Robot mood="celebrate" className="mx-auto h-28 w-24" />
                <p className="mt-2 flex items-center justify-center gap-2 text-xl font-extrabold"><CheckCircle2 className="text-teal" /> Redeemed (simulated)</p>
                <p className="mt-1">{euro(redemption.amount_cents)} marked as handed over on {format(parseISO(redemption.created_at), "d MMM yyyy, HH:mm")}.</p>
                <p className="mt-2 text-sm text-muted-foreground">No payment happened. This plan can't be redeemed twice.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p><strong>Goal:</strong> {goal.name} ({euro(goal.target_cents)})</p>
                <p><strong>{child.nickname}'s earned balance:</strong> {euro(sum.childBalance)}</p>
                <p className="flex items-center gap-2"><Clock className="size-4" /><strong>Eligible from:</strong> {format(parseISO(goal.redeem_date), "d MMMM yyyy")}</p>
                {!eligible && <p className="rounded-xl bg-sun-soft p-3 text-sm font-bold">{sum.earned === 0 ? "Nothing earned yet." : `Not yet. Redemption opens on ${format(parseISO(goal.redeem_date), "d MMM yyyy")}.`}</p>}
                {eligible && !confirming && <BigButton onClick={() => setConfirming(true)}>Redeem {euro(sum.childBalance)} (simulated)</BigButton>}
                {confirming && (
                  <div className="rounded-2xl border-2 border-navy p-4">
                    <p className="font-bold">Confirm you've handed over {euro(sum.childBalance)} for “{goal.name}” outside the app?</p>
                    <p className="text-sm text-muted-foreground">This is a simulation. No card or bank details are used.</p>
                    {redeem.error && <p role="alert" className="mt-2 text-sm font-bold text-destructive">{redeem.error.message}</p>}
                    <div className="mt-3 flex gap-2">
                      <BigButton onClick={() => redeem.mutate()} disabled={redeem.isPending}>{redeem.isPending ? "Saving…" : "Confirm (demo)"}</BigButton>
                      <BigButton variant="plain" onClick={() => setConfirming(false)}>Cancel</BigButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
