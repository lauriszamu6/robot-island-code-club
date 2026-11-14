import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { refreshAdultVerification, startAdultVerification } from "@/lib/didit.functions";
import { Card } from "./AppShell";
import { BigButton } from "./game/Controls";

/** Adult setup screens require an approved Didit identity check. */
export function VerifyGate({ children }: { children: ReactNode }) {
  const refresh = useServerFn(refreshAdultVerification);
  const start = useServerFn(startAdultVerification);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const check = () => refresh().then((r) => setStatus(r.status)).catch((e: Error) => { setErr(e.message); setStatus("Not Started"); });
  useEffect(() => { void check(); }, []);

  const begin = async () => {
    setBusy(true); setErr("");
    try {
      const { url } = await start();
      const { DiditSdk } = await import("@didit-protocol/sdk-web");
      DiditSdk.shared.onComplete = () => { void check(); };
      await DiditSdk.shared.startVerification({ url, configuration: { closeModalOnComplete: true } });
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (status === null) return <Card className="mx-auto max-w-md text-center"><p className="font-bold">Checking your verification…</p></Card>;
  if (status === "Approved") return <>{children}</>;
  const pending = status === "In Review" || status === "In Progress";
  return (
    <Card className="mx-auto max-w-md space-y-4 text-center">
      <ShieldCheck className="mx-auto size-12 text-teal" />
      <h1 className="font-display text-2xl font-bold">Verify you're the adult</h1>
      <p className="text-sm">Before setting up children or rewards, please complete a quick identity check with our partner Didit. Your documents go to Didit, not to Astrobit.</p>
      {status === "Declined" && <p className="text-sm font-bold text-coral">Your last check wasn't approved. You can try again.</p>}
      {pending && <p className="text-sm font-bold">Your check is being reviewed. <button className="underline" onClick={() => void check()}>Refresh</button></p>}
      {err && <p role="alert" className="text-sm font-bold text-coral">{err}</p>}
      <BigButton onClick={begin} disabled={busy}>{busy ? "Opening…" : "Start identity check"}</BigButton>
    </Card>
  );
}
