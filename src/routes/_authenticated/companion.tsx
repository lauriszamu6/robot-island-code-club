import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Shuffle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdventureGate, type Adventure } from "@/components/AdventureGate";
import { Card } from "@/components/AppShell";
import { CompanionAvatar } from "@/components/Robot";
import { BigButton } from "@/components/game/Controls";
import { BG_COLORS, BODY_COLORS, EYES, HEADS, MOUTHS, SIDES, TEXTURES, TOPS, parseCompanion, surprise, type Companion } from "@/lib/companion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/companion")({
  head: () => ({
    meta: [
      { title: "My robot companion — Astrobit" },
      { name: "description", content: "Build and customise your robot companion's face, colours and accessories." },
      { property: "og:title", content: "My robot companion — Astrobit" },
      { property: "og:description", content: "Customise your Astrobit robot companion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AdventureGate>{(a) => <Editor a={a} />}</AdventureGate>,
});

const label = (v: string) => v.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/0(\d)/, "$1").replace(/^./, (c) => c.toUpperCase());

function Editor({ a }: { a: Adventure }) {
  const qc = useQueryClient();
  const saved = parseCompanion(a.child.avatar);
  const [c, setC] = useState<Companion>(() => saved ?? surprise());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Companion>(k: K, v: Companion[K]) => { setC({ ...c, [k]: v }); setMsg(null); };
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("child_profiles").update({ avatar: c }).eq("id", a.child.id);
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["children"] }); setMsg({ ok: true, text: "Saved! Your robot will join you on every island." }); },
    onError: () => setMsg({ ok: false, text: "Couldn't save your robot. Check your connection and try again." }),
  });
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);

  const Row = <K extends "eyes" | "mouth" | "top" | "sides" | "texture" | "head">({ k, title, opts }: { k: K; title: string; opts: readonly Companion[K][] }) => (
    <fieldset>
      <legend className="mb-1.5 font-extrabold">{title}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => (
          <button key={o} type="button" aria-pressed={c[k] === o} onClick={() => set(k, o)} className={cn("rounded-xl border-2 border-navy px-2.5 py-1 text-sm font-bold", c[k] === o ? "bg-teal text-secondary-foreground" : "bg-card hover:bg-teal-soft")}>{label(o)}</button>
        ))}
      </div>
    </fieldset>
  );
  const Swatches = ({ k, title, all }: { k: "base" | "bg"; title: string; all: Record<string, string> }) => (
    <fieldset>
      <legend className="mb-1.5 font-extrabold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {Object.entries(all).map(([name, h]) => (
          <button key={h} type="button" aria-pressed={c[k] === h} aria-label={name} title={name} onClick={() => set(k, h)} className={cn("size-10 rounded-full border-2 border-navy", c[k] === h && "ring-4 ring-teal/60")} style={{ backgroundColor: `#${h}` }} />
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">{a.child.nickname}'s robot companion</h1>
      <p className="mt-1 text-muted-foreground">Change it any time. Your progress and rewards stay exactly the same.</p>
      <div className="mt-6 grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="md:sticky md:top-20 md:self-start">
          <Card className="text-center">
            <CompanionAvatar value={c} mood="welcome" className="mx-auto size-56" />
            <p className="mt-2 text-sm font-bold" aria-live="polite">Live preview</p>
            <div className="mt-3 flex flex-col gap-2">
              <BigButton variant="plain" onClick={() => { setC(surprise()); setMsg(null); }}><Shuffle className="size-5" /> Surprise me</BigButton>
              <BigButton onClick={() => save.mutate()} disabled={save.isPending || !dirty}>{save.isPending ? "Saving…" : dirty ? "Save my robot" : "Saved"}</BigButton>
            </div>
            {msg && <p role={msg.ok ? "status" : "alert"} className={cn("mt-3 rounded-xl p-2 text-sm font-bold", msg.ok ? "bg-mint" : "bg-coral/15 text-destructive")}>{msg.text}</p>}
            <Link to="/map" className="mt-3 inline-block text-sm font-bold text-teal underline">Back to the island map</Link>
          </Card>
        </div>
        <Card className="space-y-5">
          <Swatches k="base" title="Body colour" all={BODY_COLORS} />
          <Swatches k="bg" title="Background" all={BG_COLORS} />
          <Row k="eyes" title="Eyes" opts={EYES} />
          <Row k="mouth" title="Mouth" opts={MOUTHS} />
          <Row k="head" title="Head shape" opts={HEADS} />
          <Row k="top" title="Top accessory" opts={TOPS} />
          <Row k="sides" title="Side gadgets" opts={SIDES} />
          <Row k="texture" title="Texture" opts={TEXTURES} />
          <p className="border-t border-navy/10 pt-3 text-xs text-muted-foreground">
            Robot designs: <a className="underline" href="https://bottts.com/" target="_blank" rel="noreferrer">Bottts</a> by Pablo Stanley (free for personal and commercial use), remixed by <a className="underline" href="https://www.dicebear.com/styles/bottts/" target="_blank" rel="noreferrer">DiceBear</a>. Only a random robot code is sent to make the picture; never your name.
          </p>
        </Card>
      </div>
    </div>
  );
}
