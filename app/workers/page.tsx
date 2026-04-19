import { AppShell } from "../../components/AppShell";
import { WorkersClient, type WorkerRow } from "./WorkersClient";
import { getSupabaseServiceClient } from "../../lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normId(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

export default async function WorkersPage() {
  const supabase = getSupabaseServiceClient();

  let workerRows: unknown[] | null = null;
  let workerFetchError: { message?: string } | null = null;

  {
    const primary = await supabase
      .from("workers")
      .select("id, user_id, name, active, zone")
      .order("name", { ascending: true });
    if (primary.error) {
      console.warn("[WorkersPage] workers select with id failed, retrying without id", primary.error);
      const fallback = await supabase
        .from("workers")
        .select("user_id, name, active, zone")
        .order("name", { ascending: true });
      workerRows = fallback.data as unknown[] | null;
      workerFetchError = fallback.error;
    } else {
      workerRows = primary.data as unknown[] | null;
      workerFetchError = primary.error;
    }
  }

  if (workerFetchError) {
    console.error("[WorkersPage] Failed to fetch workers", workerFetchError);
  }

  const rows = Array.isArray(workerRows) ? workerRows : [];

  type WorkerDb = { id?: number | string; user_id?: string };
  const assignedByUserId = new Map<
    string,
    { id: string; name: string; status: string | null }
  >();

  /** Map routes.worker_id (uuid or workers.id) → auth user_id for this page's workers */
  function routeWorkerIdToUserId(routeWorkerId: unknown): string | null {
    const key = normId(routeWorkerId);
    if (!key) return null;
    for (const w of rows as WorkerDb[]) {
      if (w.user_id != null && normId(w.user_id) === key) {
        return String(w.user_id).trim();
      }
      if (w.id != null && normId(w.id) === key) {
        return w.user_id != null ? String(w.user_id).trim() : null;
      }
    }
    return null;
  }

  const { data: routeRows, error: routesErr } = await supabase
    .from("routes")
    .select("id, name, worker_id, status, created_at")
    .not("worker_id", "is", null)
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (routesErr) {
    console.error("[WorkersPage] Failed to fetch assigned routes", routesErr);
  } else {
    for (const r of routeRows ?? []) {
      const widRaw = r.worker_id;
      if (widRaw === null || widRaw === undefined) continue;
      const widStr = String(widRaw).trim();
      if (widStr === "" || widStr.toLowerCase() === "null") continue;

      const userIdKey = routeWorkerIdToUserId(widRaw);
      if (!userIdKey) continue;
      const mapKey = normId(userIdKey);
      if (assignedByUserId.has(mapKey)) continue;

      assignedByUserId.set(mapKey, {
        id: String(r.id),
        name: (typeof r.name === "string" && r.name.trim() ? r.name : "Route") as string,
        status: r.status != null ? String(r.status) : null,
      });
    }
  }

  const cleanupByUserId = new Map<string, number>();
  const { data: completedRouteRows, error: completedErr } = await supabase
    .from("routes")
    .select("worker_id, status")
    .not("worker_id", "is", null);

  if (completedErr) {
    console.error("[WorkersPage] Failed to fetch routes for cleanup counts", completedErr);
  } else {
    for (const r of completedRouteRows ?? []) {
      const st = String(r.status ?? "").trim().toLowerCase();
      if (st !== "completed") continue;
      const widRaw = r.worker_id;
      if (widRaw === null || widRaw === undefined) continue;
      const userIdKey = routeWorkerIdToUserId(widRaw);
      if (!userIdKey) continue;
      const mapKey = normId(userIdKey);
      cleanupByUserId.set(mapKey, (cleanupByUserId.get(mapKey) ?? 0) + 1);
    }
  }

  const workers: WorkerRow[] = rows.map((w: any) => {
    const uid =
      typeof w.user_id === "string" && w.user_id.trim().length > 0
        ? w.user_id.trim()
        : "";
    return {
      id: uid,
      active: !!w.active,
      zone: w.zone ?? "Unknown",
      profiles: { full_name: w.name ?? "Worker" },
      assignedRoute: uid ? assignedByUserId.get(normId(uid)) ?? null : null,
      totalCleanups: uid ? cleanupByUserId.get(normId(uid)) ?? 0 : 0,
    };
  });

  return (
    <AppShell>
      <WorkersClient workers={workers} />
    </AppShell>
  );
}
