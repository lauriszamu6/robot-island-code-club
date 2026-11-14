import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// DiceBear Constellation and Planets by DiceBear, CC0 1.0.
// Warm System preset: https://www.dicebear.com/styles/planets/
const warmColors = "e27a8c,e37f64,d88a40,c1982a,d67cb2";
const sceneUrl = (style: "constellation" | "planets", seed: string) => {
  const options = new URLSearchParams({
    seed, backgroundColor: "00000000", animationVariant: "none",
    ...(style === "planets" ? { planetColor: warmColors, ringProbability: "100", starProbability: "0" } : { constellationColor: "167D8D", cometProbability: "0" }),
  });
  return `https://api.dicebear.com/10.x/${style}/svg?${options.toString().replaceAll("%2C", ",")}`;
};

function SceneImage({ style, seed, className }: { style: "constellation" | "planets"; seed: string; className: string }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true);
  }, []);
  return (
    <div className={cn("absolute aspect-square", className)}>
      {failed ? <svg viewBox="0 0 100 100" className="size-full" fill="none">
        {style === "planets" ? <>
          <circle cx="50" cy="50" r="25" className="fill-sun stroke-coral" strokeWidth="2" />
          <path d="M29 40 Q50 48 72 40 M27 54 Q50 63 73 54" className="stroke-coral" strokeWidth="3" />
          <ellipse cx="50" cy="50" rx="45" ry="10" transform="rotate(-25 50 50)" className="stroke-coral" strokeWidth="3" />
        </> : <g className="stroke-teal fill-teal">
          <path d="M15 70 L30 30 L60 42 L85 15 M60 42 L80 80" fill="none" />
          {[ [15,70], [30,30], [60,42], [85,15], [80,80] ].map(([x,y], i) => <circle key={i} cx={x} cy={y} r="2" />)}
        </g>}
      </svg> : <img ref={image} src={sceneUrl(style, seed)} alt="" width="400" height="400" className="size-full object-contain" onError={() => setFailed(true)} />}
    </div>
  );
}

export function SpaceBackdrop({ className }: { className?: string | undefined }) {
  return (
    <div aria-hidden="true" className={cn("space-backdrop pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <SceneImage style="constellation" seed="space-lyra" className="-left-8 top-4 w-64 opacity-25 sm:w-96" />
      <SceneImage style="constellation" seed="space-orion" className="-right-16 top-[35%] w-80 opacity-25 sm:w-[440px]" />
      <SceneImage style="constellation" seed="space-ursa" className="left-[12%] top-[68%] w-72 opacity-20" />
      <SceneImage style="planets" seed="space-warm-saturn" className="-right-8 top-6 w-40 opacity-70 sm:right-6 sm:w-56" />
      <SceneImage style="planets" seed="space-warm-venus" className="-left-10 top-[55%] w-44 opacity-60 sm:w-60" />
    </div>
  );
}