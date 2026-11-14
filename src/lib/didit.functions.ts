import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BASE = "https://verification.didit.me";

async function didit(path: string, init: RequestInit = {}) {
  const key = process.env["DIDIT_API_KEY"];
  if (!key) throw new Error("Identity check isn't configured yet.");
  const res = await fetch(BASE + path, {
    ...init,
    headers: { "x-api-key": key, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    console.error("Didit error", res.status, await res.text());
    throw new Error(res.status === 401 || res.status === 403
      ? "The identity service rejected the API key."
      : "The identity service is unavailable. Try again shortly.");
  }
  return res.json() as Promise<Record<string, unknown>>;
}

async function workflowId() {
  const fixed = process.env["DIDIT_WORKFLOW_ID"];
  if (fixed) return fixed;
  const list = (await didit("/v3/workflows/")) as { results?: { uuid?: string; workflow_id?: string }[] };
  const first = list.results?.[0];
  const id = first?.workflow_id ?? first?.uuid;
  if (id) return id;
  const created = (await didit("/v3/workflows/", {
    method: "POST",
    body: JSON.stringify({ workflow_label: "Astrobit adult check", features: [
      { feature: "OCR" }, { feature: "LIVENESS", config: { face_liveness_method: "PASSIVE" } }, { feature: "FACE_MATCH" },
    ] }),
  })) as { workflow_id?: string; uuid?: string };
  return (created.workflow_id ?? created.uuid)!;
}

async function save(adultId: string, sessionId: string, status: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("adult_verifications").upsert({ adult_id: adultId, session_id: sessionId, status, updated_at: new Date().toISOString() });
}

/** Starts (or resumes) the signed-in adult's identity session. vendor_data is the server-side user id. */
export const startAdultVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = (await didit("/v3/session/", {
      method: "POST",
      body: JSON.stringify({ workflow_id: await workflowId(), vendor_data: context.userId }),
    })) as { session_id: string; url: string; status: string };
    await save(context.userId, s.session_id, s.status);
    return { url: s.url };
  });

/** Re-reads the decision from Didit for the adult's own stored session. */
export const refreshAdultVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("adult_verifications").select("session_id,status").eq("adult_id", context.userId).maybeSingle();
    if (!data?.session_id) return { status: "Not Started" };
    const d = (await didit(`/v3/session/${data.session_id}/decision/`)) as { status?: string };
    const status = d.status ?? data.status;
    await save(context.userId, data.session_id, status);
    return { status };
  });
