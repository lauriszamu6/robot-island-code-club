import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Card } from "@/components/AppShell";
import { BigButton } from "@/components/game/Controls";
import { Robot } from "@/components/Robot";
import { SkyBackdrop } from "@/components/scenery/Sky";

const safePath = (p: unknown) => (typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : "/children");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => (typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {}),
  head: () => ({
    meta: [
      { title: "Adult sign in — Astrobit" },
      { name: "description", content: "Adults sign in to manage child profiles and guide coding adventures on Astrobit." },
      { property: "og:title", content: "Adult sign in — Astrobit" },
      { property: "og:description", content: "Sign in to guide family coding adventures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const field = "mt-1 w-full rounded-xl border-2 border-navy bg-card px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-4 focus:ring-teal/40";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dest = safePath(redirect);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: dest as "/children" }); });
  }, [dest, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg({ ok: false, text: error.message });
      nav({ to: dest as "/children" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + dest } });
      setBusy(false);
      if (error) return setMsg({ ok: false, text: error.message });
      if (data.session) nav({ to: dest as "/children" });
      else setMsg({ ok: true, text: "Check your inbox to confirm your email, then sign in." });
    }
  };
  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg({ ok: false, text: "Google sign-in didn't work. Please try again." });
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <SkyBackdrop />
      <div className="relative mx-auto max-w-md px-4 py-10">
        <Card>
          <Robot mood="welcome" className="mx-auto h-24 w-20" />
          <h1 className="mt-2 text-center text-3xl font-extrabold">{mode === "in" ? "Adult sign in" : "Create an adult account"}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Accounts are for adults. Children get a nickname profile, with no email needed.</p>
          <button type="button" onClick={google} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-[#747775] bg-[#FFFFFF] px-3 font-semibold text-[#1F1F1F]">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
            Continue with Google
          </button>
          <p className="my-4 text-center text-xs font-bold text-muted-foreground">or with email</p>
          <form onSubmit={submit} className="space-y-3">
            <label className="block font-bold">Email<input type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block font-bold">Password<input type="password" required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"} className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            {msg && <p role="alert" className={msg.ok ? "rounded-xl bg-mint p-2 text-sm font-bold" : "rounded-xl bg-coral/15 p-2 text-sm font-bold text-destructive"}>{msg.text}</p>}
            <BigButton type="submit" disabled={busy} className="w-full">{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</BigButton>
          </form>
          <button className="mt-4 w-full text-sm font-bold text-teal underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
            {mode === "in" ? "New here? Create an adult account" : "Already have an account? Sign in"}
          </button>
        </Card>
      </div>
    </div>
  );
}
