import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { childrenQuery, completedSet, contentQuery, progressQuery, type ChildProfile, type Content, type Progress } from "@/lib/adventure-data";
import { useActiveChildId } from "@/lib/active-child";
import { useIsClient } from "@/lib/demo-store";
import { Card, Loading } from "./AppShell";
import { Robot } from "./Robot";
import { BigButton } from "./game/Controls";

export type Adventure = { child: ChildProfile; content: Content; progress: Progress[]; done: Set<string> };

/** Loads the active child's content + progress and handles loading, error and empty states. */
export function AdventureGate({ children }: { children: (a: Adventure) => ReactNode }) {
  const client = useIsClient();
  const activeId = useActiveChildId();
  const kids = useQuery({ ...childrenQuery, enabled: client });
  const content = useQuery({ ...contentQuery, enabled: client });
  const child = kids.data?.find((k) => k.id === activeId) ?? null;
  const progress = useQuery({ ...progressQuery(child?.id ?? "none"), enabled: !!child });

  if (!client || kids.isLoading || content.isLoading || (child && progress.isLoading)) return <Loading />;
  const err = kids.error ?? content.error ?? progress.error;
  if (err) return <ErrorState onRetry={() => { kids.refetch(); content.refetch(); progress.refetch(); }} />;
  if (!child) return <NoChild hasKids={(kids.data?.length ?? 0) > 0} />;
  if (!content.data || content.data.levels.length === 0) return <EmptyContent />;
  const p = progress.data ?? [];
  return <>{children({ child, content: content.data, progress: p, done: completedSet(p) })}</>;
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-lg p-6"><Card className="text-center" role="alert">
      <Robot mood="thinking" className="mx-auto h-24 w-20" />
      <h1 className="mt-2 text-2xl font-extrabold">Bolt couldn't reach the workshop</h1>
      <p className="mt-1 text-muted-foreground">Your progress is safe. Check your connection and try again.</p>
      <BigButton className="mt-4" onClick={onRetry}>Try again</BigButton>
    </Card></div>
  );
}
function NoChild({ hasKids }: { hasKids: boolean }) {
  return (
    <div className="mx-auto max-w-lg p-6"><Card className="text-center">
      <Robot mood="welcome" className="mx-auto h-24 w-20" />
      <h1 className="mt-2 text-2xl font-extrabold">{hasKids ? "Who's building today?" : "Add your first builder"}</h1>
      <p className="mt-1 text-muted-foreground">{hasKids ? "Pick a child profile to load their islands." : "Create a child profile with a nickname and age range. No email needed."}</p>
      <Link to="/children" className="mt-4 inline-flex min-h-12 items-center rounded-2xl chunky bg-coral px-5 font-extrabold text-primary-foreground">{hasKids ? "Choose a profile" : "Add a child profile"}</Link>
    </Card></div>
  );
}
function EmptyContent() {
  return <div className="mx-auto max-w-lg p-6"><Card className="text-center"><h1 className="text-2xl font-extrabold">No islands yet</h1><p className="mt-1 text-muted-foreground">The adventure content hasn't been published.</p></Card></div>;
}
