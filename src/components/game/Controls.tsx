import { Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function BigButton({ variant = "coral", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "coral" | "teal" | "plain" | "sun" }) {
  const v = {
    coral: "bg-coral text-primary-foreground",
    teal: "bg-teal text-secondary-foreground",
    sun: "bg-sun text-navy",
    plain: "bg-card text-navy",
  }[variant];
  return (
    <button
      {...p}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl chunky px-5 text-base font-extrabold transition-transform active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/50 [&_svg]:size-5",
        v, className,
      )}
    />
  );
}

export function RunReset({ onRun, onReset, running }: { onRun: () => void; onReset: () => void; running?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      <BigButton onClick={onRun} disabled={running}><Play /> Run</BigButton>
      <BigButton variant="plain" onClick={onReset} disabled={running}><RotateCcw /> Reset</BigButton>
    </div>
  );
}

export type EngineProps<D> = {
  def: D;
  gameId: string;
  difficulty: "gentle" | "challenge";
  onResult: (ok: boolean, message: string) => void;
  onReset: () => void;
};
