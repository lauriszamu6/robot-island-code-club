// Core 1 data access: shared content (levels/games) + per-child progress, all from the database.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Game, Level, Guide, AgeBand, Difficulty } from "./game-data";

export type ChildProfile = { id: string; nickname: string; age_range: AgeBand; difficulty: Difficulty; created_at: string; avatar: unknown };
export type Progress = { game_id: string; status: "in_progress" | "completed"; attempts: number; replays: number; completed_at: string | null };
export type Content = { levels: Level[]; games: Game[] };

export const contentQuery = queryOptions({
  queryKey: ["content"],
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<Content> => {
    const [lv, gm] = await Promise.all([
      supabase.from("levels").select("*").order("position"),
      supabase.from("games").select("*").order("level_position").order("position"),
    ]);
    if (lv.error) throw lv.error;
    if (gm.error) throw gm.error;
    return {
      levels: lv.data.map((l) => ({ n: l.position, concept: l.concept, tagline: l.description, accent: l.accent as Level["accent"], upgrade: l.upgrade })),
      games: gm.data.map((g) => ({
        id: g.id, level: g.level_position, title: g.title, goal: g.instructions,
        hints: g.hints as [string, string], guide: g.adult_guide as Guide, def: g.config as Game["def"],
      })),
    };
  },
});

export const childrenQuery = queryOptions({
  queryKey: ["children"],
  queryFn: async (): Promise<ChildProfile[]> => {
    const { data, error } = await supabase.from("child_profiles").select("id,nickname,age_range,difficulty,created_at,avatar").order("created_at");
    if (error) throw error;
    return data as ChildProfile[];
  },
});

export const progressQuery = (childId: string) => queryOptions({
  queryKey: ["progress", childId],
  queryFn: async (): Promise<Progress[]> => {
    const { data, error } = await supabase.from("game_progress").select("game_id,status,attempts,replays,completed_at").eq("child_id", childId);
    if (error) throw error;
    return data as Progress[];
  },
});

export async function recordAttempt(childId: string, gameId: string, success: boolean) {
  const { data, error } = await supabase.rpc("record_game_attempt", { _child_id: childId, _game_id: gameId, _success: success });
  if (error) throw error;
  return data as { first_completion: boolean; level_completed: number | null; game_reward_cents: number; booster_cents: number };
}

// Pure helpers (tested)
export const completedSet = (p: Progress[]) => new Set(p.filter((x) => x.status === "completed").map((x) => x.game_id));
export function levelState(games: Game[], done: Set<string>, n: number): "locked" | "available" | "completed" {
  const inLevel = games.filter((g) => g.level === n);
  if (inLevel.length && inLevel.every((g) => done.has(g.id))) return "completed";
  if (n === 1) return "available";
  const prev = games.filter((g) => g.level === n - 1);
  return prev.every((g) => done.has(g.id)) ? "available" : "locked";
}
export const nextOpenGame = (games: Game[], done: Set<string>) =>
  games.find((g) => levelState(games, done, g.level) !== "locked" && !done.has(g.id)) ?? null;
export const suggestedDifficulty = (age: AgeBand): Difficulty => (age === "10-12" ? "gentle" : "challenge");
