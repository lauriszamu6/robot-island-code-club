import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { isFreshSignIn, setMode, useMode } from "@/lib/session-mode";
import { Card } from "./AppShell";
import { BigButton } from "./game/Controls";
import { Robot } from "./Robot";

const field = "mt-1 w-full rounded-xl border-2 border-navy bg-card px-3 py-2.5 text-base font-semibold focus:outline-none focus:ring-4 focus:ring-teal/40";

/** Adult-only pages: in child mode, the adult must re-authenticate first. */
export function AdultGate({ children }: { children: ReactNode }) {
  const mode = useMode();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;
  return mode === "adult" ? <>{children}</> : <Reauth />;
}

function Reauth() {
  const [email, setEmail] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(true);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setHasPassword((data.user?.identities ?? []).some((i) => i.provider === "email"));
    });
  }, []);

  const withPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr("That password didn't match. Try again.");
    setPassword(""); setMode("adult");
  };
  const withGoogle = async () => {
    setErr("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) return setErr("Google check didn't work. Please try again.");
    const { data } = await supabase.auth.getUser();
    if (data.user?.email === email && isFreshSignIn(data.user?.last_sign_in_at)) setMode("adult");
    else setErr("Please finish signing in with the same Google account.");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <Robot mood="thinking" className="mx-auto h-24 w-20" />
        <h1 className="mt-2 flex items-center justify-center gap-2 text-2xl font-extrabold"><Lock className="size-5" /> Grown-ups only</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Reward settings and account controls need the adult to confirm it's them.</p>
        {email === null ? <p className="mt-4 text-center text-sm">Checking account…</p> : (
          <div className="mt-4 space-y-3">
            {hasPassword && (
              <form onSubmit={withPassword} className="space-y-3">
                <p className="text-sm">Signed in as <strong>{email}</strong></p>
                <label className="block font-bold">Adult password<input type="password" required autoComplete="current-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
                <BigButton type="submit" disabled={busy} className="w-full">{busy ? "Checking…" : "Unlock adult area"}</BigButton>
              </form>
            )}
            {!hasPassword && <BigButton onClick={withGoogle} className="w-full">Confirm with Google</BigButton>}
            {err && <p role="alert" className="rounded-xl bg-coral/15 p-2 text-sm font-bold text-destructive">{err}</p>}
          </div>
        )}
        <Link to="/map" className="mt-4 block text-center text-sm font-bold text-teal underline">Back to the island map</Link>
      </Card>
    </div>
  );
}
