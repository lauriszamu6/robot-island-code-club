// Transparent, rule-based challenge suggestions. No AI, no profiling.
import { GAMES, KIND_LABEL, gameById, type Game } from "./game-data";
import { isLevelUnlocked, type DemoState, type Feedback } from "./rewards";

export type Recommendation = {
  rule: string;
  message: string;
  game: Game | null;
  mode: "normal" | "practice" | "harder";
  adultTip?: string;
};

const unlocked = (s: DemoState) => GAMES.filter((g) => isLevelUnlocked(s, g.level));

export function recommend(s: DemoState, gameId: string, fun: Feedback["fun"], difficulty: Feedback["difficulty"]): Recommendation {
  const current = gameById(gameId)!;
  const open = unlocked(s);
  const nextNew = open.find((g) => !s.completed[g.id] && g.id !== gameId) ?? null;

  if (difficulty === "hard") {
    const practice = open.find((g) => g.def.kind === current.def.kind && g.id !== gameId && s.completed[g.id]) ?? current;
    return {
      rule: "Too hard → simpler practice",
      message: `Try a gentler practice round of “${practice.title}”, with an adult nearby.`,
      game: practice,
      mode: "practice",
      adultTip: `Sit together and ask: “${current.guide.question}”`,
    };
  }
  if (difficulty === "easy") {
    return {
      rule: "Too easy → harder variation",
      message: `Try “${current.title}” in Challenge mode: fewer blocks, extra goals.`,
      game: current,
      mode: "harder",
    };
  }
  if (fun === "not") {
    const other = open.find((g) => g.def.kind !== current.def.kind && !s.completed[g.id]) ??
      open.find((g) => g.def.kind !== current.def.kind) ?? null;
    return {
      rule: "Not for me → different puzzle format",
      message: other ? `Let's switch it up: “${other.title}” is a ${KIND_LABEL[other.def.kind].toLowerCase()}.` : "Take a break and come back anytime.",
      game: other,
      mode: "normal",
    };
  }
  if (fun === "loved") {
    const related = open.find((g) => g.def.kind === current.def.kind && !s.completed[g.id] && g.id !== gameId) ?? nextNew;
    return {
      rule: "Loved it + just right → related challenge",
      message: related ? `You liked this one! “${related.title}” is a similar challenge.` : "You've done every open challenge. Amazing!",
      game: related,
      mode: "normal",
    };
  }
  return {
    rule: "Next on the journey",
    message: nextNew ? `Next up: “${nextNew.title}”.` : "Every open challenge is complete!",
    game: nextNew,
    mode: "normal",
  };
}

/** Descriptive observations for adults. Completion, ratings, hints and replays stay separate. */
export function observations(s: DemoState) {
  const byKind: Record<string, { fun: number; n: number }> = {};
  for (const f of s.feedback) {
    const k = gameById(f.gameId)!.def.kind;
    byKind[k] ??= { fun: 0, n: 0 };
    byKind[k].fun += f.fun === "loved" ? 2 : f.fun === "okay" ? 1 : 0;
    byKind[k].n += 1;
  }
  const ratings: string[] = [];
  for (const [k, v] of Object.entries(byKind)) {
    const avg = v.fun / v.n;
    const label = KIND_LABEL[k as Game["def"]["kind"]].toLowerCase();
    ratings.push(avg >= 1.5 ? `Rated ${label} highly` : avg < 0.75 ? `Rated ${label} as “not for me”` : `Rated ${label} as okay`);
  }
  const hardRatings = s.feedback.filter((f) => f.difficulty === "hard").map((f) => gameById(f.gameId)!.title);
  const hintsByConcept: Record<string, number> = {};
  for (const [id, n] of Object.entries(s.hints)) {
    const g = gameById(id);
    if (g && n > 0) hintsByConcept[g.guide.concept] = (hintsByConcept[g.guide.concept] ?? 0) + n;
  }
  const hints = Object.entries(hintsByConcept).map(([c, n]) => `Needed ${n} hint${n > 1 ? "s" : ""} with ${c.toLowerCase()}`);
  const replays = Object.entries(s.replays).filter(([, n]) => n > 0).map(([id, n]) => `Voluntarily replayed “${gameById(id)?.title}” ${n}×`);
  return { ratings, hardRatings, hints, replays };
}

export const nextGame = (s: DemoState) =>
  GAMES.find((g) => isLevelUnlocked(s, g.level) && !s.completed[g.id]) ?? null;
