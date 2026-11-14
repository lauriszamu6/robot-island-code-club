import { useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { CreditCard } from "lucide-react";
import { Card } from "@/components/AppShell";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createTopupCheckout } from "@/lib/topup.functions";
import { TOPUP_MAX_CENTS, TOPUP_MIN_CENTS, TOPUP_PRESETS_CENTS, validTopupCents } from "@/lib/topup";
import { euro, toCents } from "@/lib/wallet-data";
import { cn } from "@/lib/utils";

const token = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

function Checkout({ childId, amountCents }: { childId: string; amountCents: number }) {
  const fetchClientSecret = async () => {
    const r = await createTopupCheckout({ data: { childId, amountCents, returnUrl: window.location.href, environment: getStripeEnvironment() } });
    if ("error" in r) throw new Error(r.error);
    if (!r.clientSecret) throw new Error("Payment form could not start.");
    return r.clientSecret;
  };
  return <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>;
}

/** Adult-only card top-up for one child's reward wallet. Funds can only be spent as game rewards. */
export function TopUpCard({ childId, nickname }: { childId: string; nickname: string }) {
  const [amount, setAmount] = useState<number>(TOPUP_PRESETS_CENTS[1]);
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const start = () => {
    const c = custom ? toCents(Number(custom.replace(",", "."))) : amount;
    if (!validTopupCents(c)) { setErr(`Choose between ${euro(TOPUP_MIN_CENTS)} and ${euro(TOPUP_MAX_CENTS)}.`); return; }
    try { getStripeEnvironment(); } catch (e) { setErr((e as Error).message); return; }
    setErr(null); setAmount(c); setOpen(true);
  };
  return (
    <Card className="shadow-none space-y-3">
      <div className="flex items-center gap-2"><CreditCard className="size-5" /><h2 className="text-lg font-extrabold">Top up {nickname}'s reward wallet</h2></div>
      {token?.startsWith("pk_test_") && <p className="rounded-xl bg-sun-soft px-3 py-2 text-xs font-bold">Test mode: no real card is charged. Use card 4242 4242 4242 4242.</p>}
      <p className="text-sm text-muted-foreground">Real card payment. Added money can only be paid out as game rewards and boosters, and stays in the wallet for future goals.</p>
      {open ? (
        <div className="space-y-2">
          <Checkout childId={childId} amountCents={amount} />
          <button className="text-sm font-bold text-teal underline" onClick={() => setOpen(false)}>Cancel</button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {TOPUP_PRESETS_CENTS.map((c) => (
              <button key={c} onClick={() => { setAmount(c); setCustom(""); }} className={cn("rounded-xl border-2 border-navy px-4 py-2 font-extrabold", !custom && amount === c ? "bg-teal text-primary-foreground" : "bg-card")}>{euro(c)}</button>
            ))}
            <label className="flex items-center gap-1 rounded-xl border-2 border-navy bg-card px-3 py-1 font-bold">€
              <input inputMode="decimal" aria-label="Custom amount in euros" placeholder="Other" value={custom} onChange={(e) => setCustom(e.target.value)} className="w-20 bg-transparent outline-none" />
            </label>
          </div>
          {err && <p role="alert" className="text-sm font-bold text-coral">{err}</p>}
          <button onClick={start} className="rounded-xl border-2 border-navy bg-coral px-5 py-2 font-extrabold text-primary-foreground">Continue to payment</button>
        </>
      )}
    </Card>
  );
}
