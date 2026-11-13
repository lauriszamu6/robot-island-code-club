import { Link, useNavigate } from "@tanstack/react-router";
import { Baby, ShieldCheck, RotateCcw, FlaskConical, LogOut, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setActiveChild } from "@/lib/active-child";
import { resetDemo, setDemo, useDemo } from "@/lib/demo-store";
import { Robot } from "./Robot";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const s = useDemo();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    setActiveChild(null);
    nav({ to: "/auth", replace: true });
  };
  const link = "rounded-xl px-3 py-2 text-sm font-extrabold hover:bg-teal-soft";
  const active = { className: "bg-teal-soft" };
  const switchRole = (role: "child" | "adult") => {
    setDemo((x) => ({ ...x, role }));
    nav({ to: role === "child" ? "/map" : x(s) });
  };
  const x = (st: typeof s) => (st.plan ? "/adult" : "/setup");
  return (
    <header className="sticky top-0 z-30 border-b-2 border-navy bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-3">
        <Link to="/" className="flex items-center gap-2">
          <Robot className="h-10 w-9" />
          <span className="whitespace-nowrap font-display text-lg font-extrabold sm:text-xl">Astrobit</span>
        </Link>
        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Main">
          {s.role === "child" && <>
            <Link to="/map" className={link} activeProps={active}>Island map</Link>
            <Link to="/rewards" className={link} activeProps={active}>My goal</Link>
          </>}
          {s.role === "adult" && <>
            <Link to="/adult" className={link} activeProps={active}>Dashboard</Link>
            <Link to="/setup" className={link} activeProps={active}>Plan setup</Link>
            <Link to="/redeem" className={link} activeProps={active}>Redeem</Link>
          </>}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <span className="hidden items-center gap-1 rounded-full bg-lavender-soft px-2 py-1 text-xs font-bold 2xl:inline-flex"><FlaskConical className="size-3.5" /> View switch</span>
          <button onClick={() => switchRole("child")} aria-pressed={s.role === "child"} className={cn("inline-flex items-center gap-1 rounded-xl border-2 border-navy px-2 py-1.5 text-xs font-extrabold", s.role === "child" ? "bg-teal text-secondary-foreground" : "bg-card")}><Baby className="size-4" /> Child</button>
          <button onClick={() => switchRole("adult")} aria-pressed={s.role === "adult"} className={cn("inline-flex items-center gap-1 rounded-xl border-2 border-navy px-2 py-1.5 text-xs font-extrabold", s.role === "adult" ? "bg-navy text-on-dark" : "bg-card")}><ShieldCheck className="size-4" /> Adult</button>
          {signedIn && <Link to="/children" className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold hover:bg-teal-soft" title="Child profiles"><Users className="size-4" /><span className="hidden sm:inline">Profiles</span></Link>}
          <button onClick={() => { if (window.confirm("Reset this child's demo reward data (plan and history)? Saved game progress is kept.")) { resetDemo(); } }} className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-coral/15" title="Reset demo rewards"><RotateCcw className="size-4" /><span className="hidden xl:inline">Reset demo rewards</span></button>
          {signedIn ? <button onClick={signOut} className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold hover:bg-coral/15" title="Sign out"><LogOut className="size-4" /><span className="hidden sm:inline">Sign out</span></button>
            : <Link to="/auth" className="rounded-xl border-2 border-navy bg-card px-2 py-1.5 text-xs font-extrabold">Sign in</Link>}
        </div>
      </div>
      {s.role && (
        <nav className="flex gap-1 overflow-x-auto border-t border-navy/10 px-3 py-1 md:hidden" aria-label="Main mobile">
          {s.role === "child" ? <>
            <Link to="/map" className={link} activeProps={active}>Island map</Link>
            <Link to="/rewards" className={link} activeProps={active}>My goal</Link>
          </> : <>
            <Link to="/adult" className={link} activeProps={active}>Dashboard</Link>
            <Link to="/setup" className={link} activeProps={active}>Plan</Link>
            <Link to="/redeem" className={link} activeProps={active}>Redeem</Link>
          </>}
        </nav>
      )}
    </header>
  );
}

export function DemoFunds({ className }: { className?: string }) {
  return (
    <div role="note" className={cn("flex items-center gap-2 rounded-xl border-2 border-dashed border-navy bg-sun-soft px-3 py-2 text-sm font-extrabold", className)}>
      <FlaskConical className="size-4 shrink-0" /> Demo funds — no real money.
    </div>
  );
}

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cn("rounded-3xl chunky bg-card p-5", className)} />;
}

export function Loading() {
  return <div className="flex min-h-[60vh] items-center justify-center"><Robot mood="thinking" className="h-24 w-20 anim-bob" /></div>;
}

export function NeedsPlan({ role }: { role: "child" | "adult" | null }) {
  return (
    <div className="mx-auto max-w-lg p-6">
      <Card className="text-center">
        <Robot mood="thinking" className="mx-auto h-28 w-24" />
        <h1 className="mt-3 text-2xl font-extrabold">The workshop isn't set up yet</h1>
        <p className="mt-2 text-muted-foreground">An adult needs to create a plan first: age band, rewards and a goal.</p>
        <Link to="/setup" onClick={() => setDemo((x) => ({ ...x, role: "adult" }))} className="mt-4 inline-flex min-h-12 items-center rounded-2xl chunky bg-coral px-5 font-extrabold text-primary-foreground">
          {role === "adult" ? "Set up the plan" : "Switch to adult setup"}
        </Link>
      </Card>
    </div>
  );
}
