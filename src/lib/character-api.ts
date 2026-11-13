// Optional, replaceable external character test. Game logic never depends on it.
export type ExternalCharacter = { name: string; image?: string | undefined; source: string };
const ENDPOINT = "https://adventure-time-api-lg.vercel.app/apiV1/characters/1";

export async function fetchTestCharacter(signal: AbortSignal): Promise<ExternalCharacter> {
  const res = await fetch(ENDPOINT, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  const c = j?.data ?? j;
  const name = c?.name ?? c?.fullName;
  if (!name) throw new Error("Unexpected response");
  const image = [c?.image, c?.img, c?.imageUrl, c?.sprite].find((x) => typeof x === "string");
  return { name: String(name), image, source: ENDPOINT };
}
