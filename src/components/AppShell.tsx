import { Link, useNavigate } from "@tanstack/react-router";
import { Baby, ShieldCheck, FlaskConical, LogOut, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { setActiveChild } from "@/lib/active-child";
import { setMode, useMode } from "@/lib/session-mode";
import { Robot } from "./Robot";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const mode = useMode();
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
    setMode("adult");
    nav({ to: "/auth", replace: true });
  };
  const handToChild = () => { setMode("child"); nav({ to: "/map" }); };
  const link = "rounded-xl px-3 py-2 text-sm font-extrabold hover:bg-teal-soft";
  const active = { className: "bg-teal-soft" };
  const child = signedIn && mode === "child";
  const adult = signedIn && mode === "adult";
  const links = child ? <>
    <Link to="/map" className={link} activeProps={active}>Island map</Link>
    <Link to="/rewards" className={link} activeProps={active}>My goal</Link>
  </> : adult ? <>
    <Link to="/adult" className={link} activeProps={active}>Dashboard</Link>
    <Link to="/map" className={link} activeProps={active}>Map</Link>
    <Link to="/setup" className={link} activeProps={active}>Rewards</Link>
    <Link to="/redeem" className={link} activeProps={active}>Redeem</Link>
  </> : null;
  return (
    <header className="sticky top-0 z-30 border-b-2 border-navy bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-3">
        <Link to="/" className="flex items-center gap-2">
          <Robot className="h-10 w-9" />
          <span className="whitespace-nowrap font-display text-lg font-extrabold sm:text-xl">Astrobit</span>
        </Link>
        <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Main">{links}</nav>
        <div className="ml-auto flex items-center gap-1">
          {child && <Link to="/adult" className="inline-flex items-center gap-1 rounded-xl border-2 border-navy bg-card px-2 py-1.5 text-xs font-extrabold" title="Adult area (password needed)"><ShieldCheck className="size-4" /> Adult</Link>}
          {adult && <>
            <button onClick={handToChild} className="inline-flex items-center gap-1 rounded-xl border-2 border-navy bg-teal px-2 py-1.5 text-xs font-extrabold text-secondary-foreground" title="Lock adult pages and hand the device to the child"><Baby className="size-4" /> Hand to child</button>
            <Link to="/children" className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold hover:bg-teal-soft" title="Child profiles"><Users className="size-4" /><span className="hidden sm:inline">Profiles</span></Link>
            <button onClick={signOut} className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold hover:bg-coral/15" title="Sign out"><LogOut className="size-4" /><span className="hidden sm:inline">Sign out</span></button>
          </>}
          {!signedIn && <Link to="/auth" className="rounded-xl border-2 border-navy bg-card px-2 py-1.5 text-xs font-extrabold">Sign in</Link>}
        </div>
      </div>
      {links && <nav className="flex gap-1 overflow-x-auto border-t border-navy/10 px-3 py-1 md:hidden" aria-label="Main mobile">{links}</nav>}
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
