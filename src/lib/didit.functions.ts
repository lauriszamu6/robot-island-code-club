import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BASE = "https://verification.didit.me";

async function didit(path: string, init: RequestInit = {}) {
  const key = process.env["DIDIT_API_KEY"];
  if (!key) throw new Error("Identity check isn't configured yet.");
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key.trim()))
    throw new Error("The saved Didit key looks like an application ID, not an API key.");
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

const SID = /^[0-9a-f-]{36}$/i;

/** Public: starts an identity check before an account exists (the "I'm the adult" first step). */
export const startGuestVerification = createServerFn({ method: "POST" }).handler(async () => {
  const s = (await didit("/v3/session/", {
    method: "POST",
    body: JSON.stringify({ workflow_id: await workflowId(), vendor_data: "astrobit-guest" }),
  })) as { session_id: string; url: string };
  return { url: s.url, sessionId: s.session_id };
});

/** Public: reads only the status of a guest session (no personal data returned). */
export const checkGuestVerification = createServerFn({ method: "POST" })
  .inputValidator((d: { sessionId: string }) => { if (!SID.test(d.sessionId)) throw new Error("Invalid session."); return d; })
  .handler(async ({ data }) => {
    const d = (await didit(`/v3/session/${data.sessionId}/decision/`)) as { status?: string };
    return { status: d.status ?? "Not Started" };
  });

/** Links an approved guest session to the newly signed-in adult; a session can only be claimed once. */
export const claimGuestVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => { if (!SID.test(d.sessionId)) throw new Error("Invalid session."); return d; })
  .handler(async ({ data, context }) => {
    const d = (await didit(`/v3/session/${data.sessionId}/decision/`)) as { status?: string; vendor_data?: string };
    if (d.vendor_data !== "astrobit-guest") return { status: "Not Started" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: taken } = await supabaseAdmin.from("adult_verifications").select("adult_id").eq("session_id", data.sessionId).maybeSingle();
    if (taken && taken.adult_id !== context.userId) return { status: "Not Started" };
    const status = d.status ?? "Not Started";
    await save(context.userId, data.sessionId, status);
    return { status };
  });
