// Transparent, rule-based challenge suggestions from stored data. No AI, no personality or career profiling.
import { KIND_LABEL, type Game } from "./game-data";
import { levelState, nextOpenGame, type Progress } from "./adventure-data";
import type { FeedbackRow, Objective } from "./insights-data";

export type Fun = "not_for_me" | "okay" | "loved";
export type Perceived = "too_easy" | "just_right" | "too_hard";
export type Ctx = { games: Game[]; done: Set<string>; tags: Record<string, string[]> };
export type Recommendation = { rule: string; message: string; game: Game | null; mode: "normal" | "practice" | "harder"; adultTip?: string };

const openGames = (c: Ctx) => c.games.filter((g) => levelState(c.games, c.done, g.level) !== "locked");
const shares = (c: Ctx, a: string, b: string) => (c.tags[a] ?? []).some((o) => (c.tags[b] ?? []).includes(o));

export function recommend(c: Ctx, gameId: string, fun: Fun, difficulty: Perceived): Recommendation {
  const current = c.games.find((g) => g.id === gameId)!;
  const open = openGames(c);
  const nextNew = open.find((g) => !c.done.has(g.id) && g.id !== gameId) ?? null;

  if (difficulty === "too_hard") {
    const practice = open.find((g) => g.id !== gameId && c.done.has(g.id) && shares(c, g.id, gameId)) ?? current;
    return { rule: "Too hard → simpler practice", message: `Try a gentler practice round of “${practice.title}”, with an adult nearby.`, game: practice, mode: "practice", adultTip: `Sit together and ask: “${current.guide.question}”` };
  }
  if (difficulty === "too_easy") {
    return { rule: "Too easy → harder variation", message: `Try “${current.title}” in Challenge mode: fewer blocks, extra goals.`, game: current, mode: "harder" };
  }
  if (fun === "not_for_me") {
    const other = open.find((g) => g.def.kind !== current.def.kind && !c.done.has(g.id)) ?? open.find((g) => g.def.kind !== current.def.kind) ?? null;
    return { rule: "Not for me → different puzzle format", message: other ? `Let's switch it up: “${other.title}” is a ${KIND_LABEL[other.def.kind].toLowerCase()}.` : "Take a break and come back anytime.", game: other, mode: "normal" };
  }
  if (fun === "loved") {
    const related = open.find((g) => !c.done.has(g.id) && g.id !== gameId && shares(c, g.id, gameId)) ?? nextNew;
    return { rule: "Loved it → related challenge", message: related ? `You liked this one! “${related.title}” practises a similar skill.` : "You've done every open challenge. Amazing!", game: related, mode: "normal" };
  }
  return { rule: "Next on the journey", message: nextNew ? `Next up: “${nextNew.title}”.` : "Every open challenge is complete!", game: nextNew, mode: "normal" };
}

/** Next challenge for the map: uses the latest stored rating, or explains the default when there is none. */
export function nextChallenge(c: Ctx, feedback: FeedbackRow[]): Recommendation {
  const last = feedback[feedback.length - 1];
  if (!last || !c.games.some((g) => g.id === last.game_id)) {
    const g = nextOpenGame(c.games, c.done);
    return { rule: "No ratings yet", message: g ? `No ratings yet, so we suggest the next open game: “${g.title}”.` : "Every open challenge is complete!", game: g, mode: "normal" };
  }
  const r = recommend(c, last.game_id, last.fun, last.difficulty);
  const title = c.games.find((g) => g.id === last.game_id)!.title;
  return { ...r, rule: `${r.rule} (based on your rating of “${title}”)` };
}

/** Descriptive observations for adults from stored progress and ratings. Not a score, not a profile. */
export function observations(games: Game[], objectives: Objective[], tags: Record<string, string[]>, feedback: FeedbackRow[], progress: Progress[]) {
  const title = (code: string) => objectives.find((o) => o.code === code)?.title.toLowerCase() ?? code;
  const fun: Record<string, { s: number; n: number }> = {};
  const hints: Record<string, number> = {};
  for (const f of feedback) for (const o of tags[f.game_id] ?? []) {
    (fun[o] ??= { s: 0, n: 0 }).s += f.fun === "loved" ? 2 : f.fun === "okay" ? 1 : 0;
    fun[o].n += 1;
    if (f.hints_used > 0) hints[o] = (hints[o] ?? 0) + f.hints_used;
  }
  const ratings = Object.entries(fun).map(([o, v]) => {
    const avg = v.s / v.n;
    return `${avg >= 1.5 ? "Rated" : avg < 0.75 ? "Rated as “not for me”:" : "Rated as okay:"} ${title(o)}${avg >= 1.5 ? " highly" : ""} (${v.n} rating${v.n > 1 ? "s" : ""})`;
  });
  const hardRatings = [...new Set(feedback.filter((f) => f.difficulty === "too_hard").map((f) => games.find((g) => g.id === f.game_id)?.title ?? f.game_id))];
  const hintList = Object.entries(hints).map(([o, n]) => `Used ${n} hint${n > 1 ? "s" : ""} on games about ${title(o)}`);
  const replays = progress.filter((p) => p.replays > 0).map((p) => `Voluntarily replayed “${games.find((g) => g.id === p.game_id)?.title}” ${p.replays}×`);
  return { ratings, hardRatings, hints: hintList, replays };
}
