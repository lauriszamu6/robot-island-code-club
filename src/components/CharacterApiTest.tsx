import { useState } from "react";
import { fetchTestCharacter, type ExternalCharacter } from "@/lib/character-api";
import { Robot } from "./Robot";

export function CharacterApiTest() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [c, setC] = useState<ExternalCharacter | null>(null);
  const [err, setErr] = useState("");
  const [imgFailed, setImgFailed] = useState(false);
  const run = async () => {
    setState("loading"); setImgFailed(false);
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
    try { setC(await fetchTestCharacter(ctl.signal)); setState("ok"); }
    catch (e) { setErr(e instanceof Error ? e.message : "failed"); setState("fail"); }
    finally { clearTimeout(t); }
  };
  return (
    <div>
      <p className="text-sm text-muted-foreground">A separate test of an external, unofficial character API. Not affiliated with any show; the app never depends on it.</p>
      <div className="mt-3 flex items-center gap-4">
        {state === "ok" && c?.image && !imgFailed ? (
          <img src={c.image} alt={c.name} className="h-20 w-20 rounded-xl border-2 border-navy object-contain" onError={() => setImgFailed(true)} />
        ) : (
          <Robot mood={state === "fail" ? "thinking" : "welcome"} className="h-20 w-16" title="Placeholder robot" />
        )}
        <div className="text-sm">
          {state === "idle" && <p>Not tested yet.</p>}
          {state === "loading" && <p>Fetching…</p>}
          {state === "ok" && <p><strong>Fetched:</strong> {c?.name}{(!c?.image || imgFailed) && " (no image, showing placeholder)"}</p>}
          {state === "fail" && <p><strong>Request failed</strong> ({err}). Showing the original robot placeholder.</p>}
          <button onClick={run} className="mt-1 rounded-xl border-2 border-navy bg-card px-3 py-1.5 font-bold">Run API test</button>
        </div>
      </div>
    </div>
  );
}
