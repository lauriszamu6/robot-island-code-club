import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Baby, ShieldCheck } from "lucide-react";
import { Robot } from "@/components/Robot";
import { SkyBackdrop } from "@/components/scenery/Sky";
import { IslandArt } from "@/components/scenery/Island";
import { BigButton } from "@/components/game/Controls";
import { setDemo, useDemo } from "@/lib/demo-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Robot Builders — choose who's playing" },
      { name: "description", content: "Welcome to Robot Builders: repair floating robot workshops by solving coding challenges together." },
      { property: "og:title", content: "Robot Builders — welcome" },
      { property: "og:description", content: "Repair floating robot workshops by solving coding challenges together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const s = useDemo();
  const nav = useNavigate();
  const go = (role: "child" | "adult") => {
    setDemo((x) => ({ ...x, role }));
    if (role === "child") nav({ to: "/map" });
    else nav({ to: s.plan ? "/adult" : "/setup" });
  };
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <SkyBackdrop />
      <div className="relative mx-auto grid max-w-5xl items-center gap-8 px-5 py-12 md:grid-cols-2 md:py-20">
        <div className="anim-enter">
          <p className="inline-block rounded-full bg-teal px-3 py-1 text-sm font-extrabold text-secondary-foreground">For ages 10–15 + a trusted adult</p>
          <h1 className="mt-4 text-5xl font-extrabold md:text-6xl">Robot Builders</h1>
          <p className="mt-4 max-w-md text-lg">Fix up five floating workshop islands by solving coding puzzles with Bolt. Adults can guide without knowing how to code.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <BigButton onClick={() => go("child")} className="min-h-14 text-lg"><Baby /> I'm the builder (child)</BigButton>
            <BigButton variant="plain" onClick={() => go("adult")} className="min-h-14 text-lg"><ShieldCheck /> I'm the adult</BigButton>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Prototype: choosing a role is a demo shortcut, not a secure sign-in. All money is demo money.</p>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <IslandArt accent="teal" status="completed" className="w-full anim-bob" />
          <Robot mood="welcome" className="absolute -top-10 left-1/2 h-36 w-28 -translate-x-1/2" />
        </div>
      </div>
    </div>
  );
}
