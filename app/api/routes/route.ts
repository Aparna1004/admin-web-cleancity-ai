import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { dbg, dbgErr } from "../../../lib/debugLog";
import { getSupabaseServiceClient } from "../../../lib/supabaseServer";

export const dynamic = "force-dynamic";

function normStatus(status: unknown): string {
  return String(status ?? "").trim().toLowerCase();
}

function normalizeReportIds(reportIds: unknown): string[] {
  if (reportIds == null) return [];
  if (Array.isArray(reportIds)) {
    return reportIds.map(String).filter(Boolean);
  }
  if (typeof reportIds === "string") {
    const s = reportIds.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s) as unknown;
      return Array.isArray(parsed)
        ? parsed.map(String).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }
  // PostgREST sometimes returns JSON/array columns as { "0": id, "1": id }.
  if (typeof reportIds === "object" && reportIds !== null) {
    const o = reportIds as Record<string, unknown>;
    const keys = Object.keys(o)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b));
    if (keys.length > 0) {
      return keys.map((k) => String(o[k] ?? "")).filter(Boolean);
    }
  }
  return [];
}

function hasAssignedWorkerId(workerId: unknown): boolean {
  if (workerId === null || workerId === undefined) return false;
  if (typeof workerId === "object") {
    if (Array.isArray(workerId)) {
      return workerId.length > 0;
    }
    const v = workerId as { toString?: () => string };
    if (typeof v?.toString === "function") {
      const s = String(v.toString()).trim();
      return s.length > 0 && s.toLowerCase() !== "null";
    }
    // Unknown object shape — do not treat as assigned (avoids false positives).
    return false;
  }
  const s = String(workerId).trim();
  if (s === "" || s.toLowerCase() === "null" || s === "undefined") return false;
  return true;
}

/** Route is still available to assign to a worker */
function isRouteUnassignedForPicker(r: {
  worker_id: string | null;
  status: string;
}): boolean {
  if (hasAssignedWorkerId(r.worker_id)) return false;
  const st = String(r.status ?? "").trim().toLowerCase();
  const blocked = ["assigned", "cleaned", "completed", "done", "cancelled", "archived"];
  if (blocked.includes(st)) return false;
  return true;
}

/** Terminal / finished — hide from assignment picker (raw DB row before ?? "pending"). */
function isTerminalRouteStatusDb(status: unknown): boolean {
  const st = normStatus(status);
  return ["cleaned", "completed", "done", "cancelled", "archived"].includes(st);
}

function isActiveRouteStatus(status: unknown): boolean {
  const st = normStatus(status);
  // "cleaned", "completed", "done", "cancelled", "archived" are terminal — never active.
  const terminal = ["cleaned", "completed", "done", "cancelled", "archived"];
  if (terminal.includes(st)) return false;
  // Null/empty status is treated as pending (mobile app may not set a status).
  return true;
}

export async function GET(req: Request) {
  noStore();
  try {
    dbg("api/routes", "GET start", { url: req.url });
    const supabase = getSupabaseServiceClient();

    const url = new URL(req.url);
    const forAssignment =
      url.searchParams.get("for_assignment") === "1" ||
      url.searchParams.get("for_assignment") === "true";

    // Assignment dropdown: no embed (avoids join quirks); list view keeps worker names.
    const selectForAssignment = `
      id,
      name,
      area_id,
      report_ids,
      google_maps_url,
      worker_id,
      status,
      date,
      created_at
    `;
    const selectFull = `
      id,
      name,
      area_id,
      report_ids,
      google_maps_url,
      worker_id,
      status,
      date,
      created_at,
      workers ( id, name )
    `;

    let routes: unknown[] | null = null;
    let error: { message?: string; code?: string } | null = null;

    if (forAssignment) {
      // DB-level: only unassigned rows whose status is not a terminal/taken value.
      // Using individual .neq() calls — more reliable than .not("in",...) with string values.
      const res = await supabase
        .from("routes")
        .select(selectForAssignment)
        .is("worker_id", null)
        .neq("status", "assigned")
        .neq("status", "cleaned")
        .neq("status", "completed")
        .neq("status", "done")
        .neq("status", "cancelled")
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(500);
      routes = res.data as unknown[] | null;
      error = res.error;
    } else {
      let query = supabase
        .from("routes")
        .select(selectFull)
        .order("created_at", { ascending: false });
      query = query.neq("status", "completed");
      const res = await query;
      routes = res.data as unknown[] | null;
      error = res.error;
    }

    if (error) {
      console.error("[routes:GET] Supabase error", error);

      if (
        error.code === "PGRST205" ||
        error.message?.includes("Could not find the table")
      ) {
        return NextResponse.json(
          { error: "Routes table not created yet. Please create the routes table in Supabase." },
          { status: 404 }
        );
      }

      return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }

    let formattedRoutes = (routes ?? []).map((route: any) => ({
      id: String(route.id),
      name: route.name ?? null,
      zone: route.area_id ?? null,
      area_id: route.area_id ?? null,
      stops: normalizeReportIds(route.report_ids).length,
      report_ids: normalizeReportIds(route.report_ids),
      google_maps_url: route.google_maps_url ?? null,
      total_severity: 0,
      worker: route.workers?.[0]?.name ?? "Unassigned",
      worker_id: route.worker_id ?? null,
      status: String(route.status ?? "").trim() || "pending",
      created_at: route.created_at ?? null,
    }));

    // Normalize worker_id: empty string, literal "null"/"undefined" text, etc.
    formattedRoutes = formattedRoutes.map((r) => {
      const raw = r.worker_id;
      let wid: string | null = raw as string | null;
      if (raw == null) wid = null;
      else {
        const s = String(raw).trim();
        const sl = s.toLowerCase();
        if (s === "" || sl === "null" || sl === "undefined") wid = null;
        else wid = s;
      }
      return { ...r, worker_id: wid };
    });

    // Keep only active route lifecycle statuses for consistency in all views.
    formattedRoutes = formattedRoutes.filter((r) =>
      isActiveRouteStatus(r.status)
    );

    if (forAssignment) {
      // Drop terminal rows using raw-ish status (already string on row).
      formattedRoutes = formattedRoutes.filter(
        (r) => !isTerminalRouteStatusDb(r.status)
      );
      // Every row with no worker and non-terminal status (no fingerprint dedupe — avoids losing valid routes).
      formattedRoutes = formattedRoutes
        .filter((r) => isRouteUnassignedForPicker(r))
        .sort((a, b) =>
          String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
        );
    }

    formattedRoutes = formattedRoutes.map((r, index) => ({
      ...r,
      name: r.name ?? `Batch ${index + 1}`,
    }));

    return NextResponse.json(formattedRoutes, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[routes:GET] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}