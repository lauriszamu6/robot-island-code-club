import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/AppShell";
import { BigButton } from "@/components/game/Controls";
import { Robot } from "@/components/Robot";
import { SkyBackdrop } from "@/components/scenery/Sky";
import { setMode } from "@/lib/session-mode";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Astrobit" },
      { name: "description", content: "Set a new password for your Astrobit adult account." },
      { property: "og:title", content: "Choose a new password — Astrobit" },
      { property: "og:description", content: "Reset your Astrobit adult account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

const field = "mt-1 w-full rounded-xl border-2 border-navy bg-card px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-4 focus:ring-teal/40";

function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState<"wait" | "ok" | "bad">("wait");
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === "PASSWORD_RECOVERY") setReady("ok"); });
    const t = setTimeout(() => supabase.auth.getSession().then(({ data: s }) => setReady((r) => (r === "ok" ? r : s.session && isRecovery ? "ok" : s.session ? "ok" : "bad"))), 1200);
    return () => { data.subscription.unsubscribe(); clearTimeout(t); };
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    if (pw !== pw2) return setErr("The two passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message);
    setMode("adult");
    nav({ to: "/children" });
  };
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <SkyBackdrop />
      <div className="relative mx-auto max-w-md px-4 py-10">
        <Card>
          <Robot mood="thinking" className="mx-auto h-24 w-20" />
          <h1 className="mt-2 text-center text-3xl font-extrabold">Choose a new password</h1>
          {ready === "wait" && <p className="mt-4 text-center text-sm">Checking your reset link…</p>}
          {ready === "bad" && <div className="mt-4 text-center"><p role="alert" className="rounded-xl bg-coral/15 p-2 text-sm font-bold text-destructive">This reset link is invalid or has expired.</p><Link to="/auth" className="mt-3 inline-block font-bold text-teal underline">Request a new link</Link></div>}
          {ready === "ok" && (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block font-bold">New password<input type="password" required minLength={8} autoComplete="new-password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
              <label className="block font-bold">Repeat new password<input type="password" required minLength={8} autoComplete="new-password" className={field} value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
              {err && <p role="alert" className="rounded-xl bg-coral/15 p-2 text-sm font-bold text-destructive">{err}</p>}
              <BigButton type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Save new password"}</BigButton>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
