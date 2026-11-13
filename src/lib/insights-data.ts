// Core 3 data access: educational objectives, game tags and stored post-game feedback.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Fun, Perceived } from "./recommend";

export type Objective = { code: string; title: string; description: string };
export type Objectives = { list: Objective[]; tags: Record<string, string[]> };
export type FeedbackRow = { id: string; game_id: string; fun: Fun; difficulty: Perceived; hints_used: number; was_replay: boolean; submitted_at: string };

export const objectivesQuery = queryOptions({
  queryKey: ["objectives"],
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<Objectives> => {
    const [o, t] = await Promise.all([
      supabase.from("learning_objectives").select("code,title,description"),
      supabase.from("game_objectives").select("game_id,objective_code"),
    ]);
    if (o.error) throw o.error;
    if (t.error) throw t.error;
    const tags: Record<string, string[]> = {};
    for (const r of t.data) (tags[r.game_id] ??= []).push(r.objective_code);
    return { list: o.data, tags };
  },
});

export const feedbackQuery = (childId: string) => queryOptions({
  queryKey: ["feedback", childId],
  queryFn: async (): Promise<FeedbackRow[]> => {
    const { data, error } = await supabase.from("game_feedback").select("id,game_id,fun,difficulty,hints_used,was_replay,submitted_at").eq("child_id", childId).order("submitted_at");
    if (error) throw error;
    return data as FeedbackRow[];
  },
});

export async function submitFeedback(childId: string, gameId: string, fun: Fun, difficulty: Perceived, hintsUsed: number) {
  const { error } = await supabase.rpc("submit_game_feedback", { _child_id: childId, _game_id: gameId, _fun: fun, _difficulty: difficulty, _hints_used: hintsUsed });
  if (error) throw new Error(error.message);
}
