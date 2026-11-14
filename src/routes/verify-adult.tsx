import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/AppShell";
import { BigButton } from "@/components/game/Controls";
import { SkyBackdrop } from "@/components/scenery/Sky";
import { checkGuestVerification, startGuestVerification } from "@/lib/didit.functions";
import { getGuestSession, setGuestSession } from "@/lib/guest-verification";

export const Route = createFileRoute("/verify-adult")({
  head: () => ({
    meta: [
      { title: "Confirm you're an adult — Astrobit" },
      { name: "description", content: "Adults confirm their identity with Didit before creating an Astrobit account." },
      { property: "og:title", content: "Confirm you're an adult — Astrobit" },
      { property: "og:description", content: "A quick ID and selfie check before adult sign-up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyAdult,
});

function VerifyAdult() {
  const nav = useNavigate();
  const start = useServerFn(startGuestVerification);
  const check = useServerFn(checkGuestVerification);
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const id = getGuestSession();
    if (!id) return setStatus("Not Started");
    try {
      const r = await check({ data: { sessionId: id } });
      setStatus(r.status);
      if (r.status === "Approved") nav({ to: "/auth", search: { mode: "up" } });
    } catch (e) { setErr((e as Error).message); setStatus("Not Started"); }
  };
  useEffect(() => { void refresh(); }, []);

  const begin = async () => {
    setBusy(true); setErr("");
    try {
      const { url, sessionId } = await start();
      setGuestSession(sessionId);
      const { DiditSdk } = await import("@didit-protocol/sdk-web");
      DiditSdk.shared.onComplete = () => { void refresh(); };
      await DiditSdk.shared.startVerification({ url, configuration: { closeModalOnComplete: true } });
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const pending = status === "In Review" || status === "In Progress";
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <SkyBackdrop />
      <div className="relative mx-auto max-w-md px-4 py-10">
        <Card className="space-y-4 text-center">
          <ShieldCheck className="mx-auto size-12 text-teal" />
          <h1 className="text-3xl font-extrabold">Step 1: confirm you're an adult</h1>
          <p className="text-sm">Before creating your account, do a quick ID and selfie check with our partner Didit. Your documents go to Didit, not to Astrobit.</p>
          {status === null && <p className="text-sm font-bold">Checking…</p>}
          {status === "Declined" && <p className="text-sm font-bold text-coral">Your last check wasn't approved. You can try again.</p>}
          {pending && <p className="text-sm font-bold">Your check is being reviewed. <button className="underline" onClick={() => void refresh()}>Refresh</button></p>}
          {err && <p role="alert" className="text-sm font-bold text-coral">{err}</p>}
          <BigButton onClick={begin} disabled={busy || status === null} className="w-full">{busy ? "Opening…" : "Start identity check"}</BigButton>
          <p className="text-sm">Then you'll create your account and confirm your email.</p>
          <Link to="/auth" className="block text-sm font-bold text-teal underline">Already have an account? Sign in</Link>
        </Card>
      </div>
    </div>
  );
}
