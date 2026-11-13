// Robot companion built with DiceBear's Bottts style (https://www.dicebear.com/styles/bottts/).
// Bottts by Pablo Stanley, "Free for personal and commercial use" (https://bottts.com/), remixed by DiceBear.
// Requests only ever contain a random neutral seed ("bot-…") and style options, never personal data.
export const EYES = ["happy", "round", "eva", "glow", "hearts", "bulging", "dizzy", "frame1", "frame2", "robocop", "roundFrame01", "roundFrame02", "sensor", "shade01"] as const;
export const MOUTHS = ["smile01", "smile02", "bite", "diagram", "grill01", "grill02", "grill03", "square01", "square02"] as const;
export const TOPS = ["antenna", "antennaCrooked", "bulb01", "glowingBulb01", "glowingBulb02", "horns", "lights", "pyramid", "radar"] as const;
export const SIDES = ["antenna01", "antenna02", "cables01", "cables02", "round", "square", "squareAssymetric"] as const;
export const TEXTURES = ["none", "circuits", "dots", "camo01", "camo02", "dirty01", "dirty02", "grunge01", "grunge02"] as const;
export const HEADS = ["round01", "round02", "square01", "square02", "square03", "square04"] as const;
// Astrobit palette (hex without #)
export const BODY_COLORS = { Teal: "167D8D", Coral: "C4473A", Yellow: "F4C542", Lavender: "B8A4E3", Mint: "BCE8D5", Navy: "203047" } as const;
export const BG_COLORS = { Cream: "FFF8ED", Mint: "BCE8D5", Yellow: "FBE7A8", Lavender: "E6DEF6", Sky: "D9EEF2" } as const;

export type Companion = {
  seed: string; eyes: (typeof EYES)[number]; mouth: (typeof MOUTHS)[number]; top: (typeof TOPS)[number];
  sides: (typeof SIDES)[number]; texture: (typeof TEXTURES)[number]; head: (typeof HEADS)[number]; base: string; bg: string;
};

const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]!;
export const neutralSeed = () => "bot-" + Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10);

export function surprise(): Companion {
  return { seed: neutralSeed(), eyes: pick(EYES), mouth: pick(MOUTHS), top: pick(TOPS), sides: pick(SIDES), texture: pick(TEXTURES), head: pick(HEADS), base: pick(Object.values(BODY_COLORS)), bg: pick(Object.values(BG_COLORS)) };
}

const isIn = <T extends string>(a: readonly T[], v: unknown): v is T => typeof v === "string" && (a as readonly string[]).includes(v);
const hex = (v: unknown, all: Record<string, string>) => (typeof v === "string" && Object.values(all).includes(v) ? v : null);

/** Validates stored data; returns null when unusable so the built-in robot is shown instead. */
export function parseCompanion(v: unknown): Companion | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o["seed"] !== "string" || !/^bot-[a-z0-9]{6,16}$/.test(o["seed"])) return null;
  if (!isIn(EYES, o["eyes"]) || !isIn(MOUTHS, o["mouth"]) || !isIn(TOPS, o["top"]) || !isIn(SIDES, o["sides"]) || !isIn(TEXTURES, o["texture"]) || !isIn(HEADS, o["head"])) return null;
  const base = hex(o["base"], BODY_COLORS), bg = hex(o["bg"], BG_COLORS);
  if (!base || !bg) return null;
  return { seed: o["seed"], eyes: o["eyes"], mouth: o["mouth"], top: o["top"], sides: o["sides"], texture: o["texture"], head: o["head"], base, bg };
}

export function companionUrl(c: Companion) {
  const q = new URLSearchParams({
    seed: c.seed, eyesVariant: c.eyes, mouthVariant: c.mouth, topVariant: c.top, sidesVariant: c.sides, headVariant: c.head,
    baseColor: c.base, backgroundColor: c.bg, topProbability: "100", sidesProbability: "100",
    textureProbability: c.texture === "none" ? "0" : "100", borderRadius: "20",
  });
  if (c.texture !== "none") q.set("textureVariant", c.texture);
  return `https://api.dicebear.com/10.x/bottts/svg?${q.toString()}`;
}
