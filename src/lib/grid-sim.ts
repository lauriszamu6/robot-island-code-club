import type { Block, Difficulty, GridDef, Pos, SimpleBlock } from "./game-data";

export type Frame = Pos & { dir: number; stars: string[] };
export type SimResult = { ok: boolean; message: string; frames: Frame[] };

const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
const key = (p: Pos) => `${p.x},${p.y}`;

export const countBlocks = (prog: Block[]) => prog.reduce((a, b) => a + (b.t === "REP" ? 1 + b.body.length : 1), 0);

export function simulate(def: GridDef, prog: Block[], difficulty: Difficulty): SimResult {
  const walls = new Set(def.walls.map(key));
  const starSet = new Set(def.stars.map(key));
  const needStars = difficulty === "challenge";
  let cur: Frame = { x: def.start.x, y: def.start.y, dir: def.start.dir, stars: [] };
  const frames: Frame[] = [cur];
  const blocked = (f: Frame) => {
    const nx = f.x + DX[f.dir]!, ny = f.y + DY[f.dir]!;
    return nx < 0 || ny < 0 || nx >= def.cols || ny >= def.rows || walls.has(`${nx},${ny}`);
  };
  const atGoal = () => cur.x === def.goal.x && cur.y === def.goal.y && (!needStars || cur.stars.length === starSet.size);
  const limit = def.maxBlocks[difficulty];
  if (prog.length === 0) return { ok: false, message: "The program is empty. Add some blocks first.", frames };
  if (countBlocks(prog) > limit) return { ok: false, message: `That uses ${countBlocks(prog)} blocks, but the limit is ${limit}. Can a Repeat help?`, frames };

  const step = (b: SimpleBlock): string | null => {
    if (b.t === "L") cur = { ...cur, dir: (cur.dir + 3) % 4 };
    else if (b.t === "R") cur = { ...cur, dir: (cur.dir + 1) % 4 };
    else if (b.t === "IF" && blocked(cur)) cur = { ...cur, dir: (cur.dir + (b.turn === "R" ? 1 : 3)) % 4 };
    else {
      if (blocked(cur)) return "Bonk! Bolt bumped into a wall or the edge.";
      const nx = cur.x + DX[cur.dir]!, ny = cur.y + DY[cur.dir]!;
      const k = `${nx},${ny}`;
      cur = { ...cur, x: nx, y: ny, stars: starSet.has(k) && !cur.stars.includes(k) ? [...cur.stars, k] : cur.stars };
    }
    frames.push(cur);
    return null;
  };

  for (const b of prog) {
    const seq = b.t === "REP" ? Array.from({ length: b.n }, () => b.body).flat() : [b];
    for (const s of seq) {
      const err = step(s);
      if (err) return { ok: false, message: err, frames };
      if (atGoal()) return { ok: true, message: needStars ? "Goal reached with every star collected!" : "Bolt reached the goal!", frames };
    }
  }
  if (cur.x === def.goal.x && cur.y === def.goal.y && needStars)
    return { ok: false, message: `Bolt reached the goal but collected only ${cur.stars.length} of ${starSet.size} stars.`, frames };
  return { ok: false, message: "Bolt stopped before reaching the goal. Where did it end up?", frames };
}
