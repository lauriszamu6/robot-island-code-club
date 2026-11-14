import { VerifyGate } from "@/components/VerifyGate";
import { setMode } from "@/lib/session-mode";
import { AdultGate } from "@/components/AdultGate";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, Loading } from "@/components/AppShell";
import { ErrorState } from "@/components/AdventureGate";
import { BigButton } from "@/components/game/Controls";
import { Robot } from "@/components/Robot";
import { childrenQuery, suggestedDifficulty } from "@/lib/adventure-data";
import { setActiveChild, useActiveChildId } from "@/lib/active-child";
import { setDemo } from "@/lib/demo-store";
import type { AgeBand, Difficulty } from "@/lib/game-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/children")({
  head: () => ({
    meta: [
      { title: "Child profiles — Astrobit" },
      { name: "description", content: "Add and choose child profiles with a nickname and age range. Each child keeps separate progress." },
      { property: "og:title", content: "Child profiles — Astrobit" },
      { property: "og:description", content: "Nickname-only child profiles with separate progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AdultGate><VerifyGate><Children /></VerifyGate></AdultGate>,
});

function Children() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const active = useActiveChildId();
  const kids = useQuery(childrenQuery);
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState<AgeBand | null>(null);
  const [diff, setDiff] = useState<Difficulty | null>(null);
  const [err, setErr] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      if (!nickname.trim() || !age) throw new Error("Add a nickname and choose an age range.");
      const { data, error } = await supabase.from("child_profiles").insert({ nickname: nickname.trim(), age_range: age, difficulty: diff ?? suggestedDifficulty(age) }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => { setNickname(""); setAge(null); setDiff(null); setErr(""); qc.invalidateQueries({ queryKey: ["children"] }); setActiveChild(id); },
    onError: (e) => setErr(e instanceof Error ? e.message : "Couldn't save the profile."),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("child_profiles").delete().eq("id", id); if (error) throw error; return id; },
    onSuccess: (id) => { if (id === active) setActiveChild(null); qc.invalidateQueries({ queryKey: ["children"] }); },
  });

  const pick = (id: string, role: "child" | "adult") => { setActiveChild(id); if (role === "child") setMode("child"); nav({ to: role === "child" ? "/map" : "/adult" }); };

  if (kids.isLoading) return <Loading />;
  if (kids.error) return <ErrorState onRetry={() => kids.refetch()} />;
  const list = kids.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Child profiles</h1>
      <p className="text-muted-foreground">Each child has their own islands and progress. Only you can see your children's profiles.</p>
      {list.length === 0 ? (
        <Card className="text-center"><Robot mood="welcome" className="mx-auto h-20 w-16" /><p className="mt-2 font-bold">No profiles yet. Add your first builder below.</p></Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((k) => (
            <li key={k.id}><Card className={cn(k.id === active && "ring-4 ring-teal/50")}>
              <div className="flex items-center gap-2">
                <p className="text-xl font-extrabold">{k.nickname}</p>
                {k.id === active && <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-xs font-extrabold"><CheckCircle2 className="size-3.5" /> Selected</span>}
                <button aria-label={`Delete ${k.nickname}`} onClick={() => { if (window.confirm(`Delete ${k.nickname}'s profile and all their progress?`)) remove.mutate(k.id); }} className="ml-auto rounded-lg p-2 hover:bg-coral/15"><Trash2 className="size-4" /></button>
              </div>
              <p className="text-sm">Age {k.age_range.replace("-", "–")} · {k.difficulty === "gentle" ? "Gentle" : "Challenge"} difficulty</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <BigButton onClick={() => pick(k.id, "child")}>Play as {k.nickname}</BigButton>
                <BigButton variant="plain" onClick={() => pick(k.id, "adult")}>Adult view</BigButton>
              </div>
            </Card></li>
          ))}
        </ul>
      )}
      <Card>
        <h2 className="text-xl font-extrabold">Add a child profile</h2>
        <form className="mt-3 space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <label className="block font-bold">Nickname<input maxLength={30} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. Sparky" className="mt-1 w-full rounded-xl border-2 border-navy bg-card px-3 py-2.5 font-semibold" /></label>
          <fieldset><legend className="font-bold">Age range</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">{(["8-10", "11-12"] as AgeBand[]).map((b) => (
              <button type="button" key={b} aria-pressed={age === b} onClick={() => { setAge(b); setDiff(suggestedDifficulty(b)); }} className={cn("rounded-2xl border-2 border-navy px-4 py-3 font-extrabold", age === b ? "bg-teal text-secondary-foreground" : "bg-card")}>{b.replace("-", "–")} years</button>
            ))}</div>
          </fieldset>
          {age && <fieldset><legend className="font-bold">Starting difficulty <span className="font-semibold text-muted-foreground">(suggested: {suggestedDifficulty(age) === "gentle" ? "Gentle" : "Challenge"})</span></legend>
            <div className="mt-2 flex gap-2">{(["gentle", "challenge"] as Difficulty[]).map((d) => (
              <button type="button" key={d} aria-pressed={diff === d} onClick={() => setDiff(d)} className={cn("rounded-xl border-2 border-navy px-4 py-2 font-bold", diff === d ? "bg-navy text-on-dark" : "bg-card")}>{d === "gentle" ? "Gentle" : "Challenge"}</button>
            ))}</div>
          </fieldset>}
          {err && <p role="alert" className="text-sm font-bold text-destructive">{err}</p>}
          <BigButton type="submit" disabled={add.isPending}><Plus /> {add.isPending ? "Saving…" : "Add profile"}</BigButton>
        </form>
      </Card>
    </div>
  );
}
