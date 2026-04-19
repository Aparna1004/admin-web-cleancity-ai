import { NextResponse } from "next/server";
import { dbg, dbgErr } from "../../../lib/debugLog";
import { getSupabaseServiceClient } from "../../../lib/supabaseServer";

export const dynamic = "force-dynamic";

function reportIdsFingerprint(reportIds: unknown): string {
  if (!Array.isArray(reportIds) || reportIds.length === 0) return "";
  return [...reportIds].map(String).filter(Boolean).sort().join("|");
}

function hasAssignedWorkerId(workerId: unknown): boolean {
  if (workerId === null || workerId === undefined) return false;
  if (typeof workerId === "object") {
    // Rare JSON shapes from views / legacy data
    const v = workerId as { toString?: () => string };
    if (typeof v?.toString === "function") {
      const s = String(v.toString()).trim();
      return s.length > 0 && s.toLowerCase() !== "null";
    }
    return true;
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
  if (["assigned", "cleaned", "completed"].includes(st)) return false;
  return true;
}

export async function GET(req: Request) {
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

    let query = supabase
      .from("routes")
      .select(forAssignment ? selectForAssignment : selectFull)
      .order("created_at", { ascending: false });

    // Hide completed routes from both the main list and the assignment dropdown.
    // (Workers should only deal with open/in-progress routes.)
    query = query.neq("status", "completed");

    // For assignment: do NOT use .is(worker_id, null) only — duplicate rows often share
    // report_ids (one ghost row still null, the real row assigned). We fetch non-completed
    // routes and filter in JS, excluding stop-sets already tied to an assigned route.

    const { data: routes, error } = await query;

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
      id: route.id,
      name: route.name ?? `Route-${route.id.slice(0, 6)}`,
      zone: route.area_id ?? null,
      area_id: route.area_id ?? null,
      stops: route.report_ids?.length ?? 0,
      report_ids: route.report_ids ?? [],
      google_maps_url: route.google_maps_url ?? null,
      total_severity: 0,
      worker: route.workers?.[0]?.name ?? "Unassigned",
      worker_id: route.worker_id ?? null,
      status: route.status ?? "pending",
      created_at: route.created_at ?? null,
    }));

    // Treat empty-string worker_id as unassigned (PostgREST .is(null) may not match "").
    formattedRoutes = formattedRoutes.map((r) => ({
      ...r,
      worker_id:
        r.worker_id == null || String(r.worker_id).trim() === ""
          ? null
          : r.worker_id,
    }));

    if (forAssignment) {
      // Fingerprints already "claimed" by a non-assignable row (assigned / cleaned / has worker).
      const takenFingerprints = new Set<string>();
      for (const r of formattedRoutes) {
        if (isRouteUnassignedForPicker(r)) continue;
        const fp =
          reportIdsFingerprint(r.report_ids) || `id:${String(r.id)}`;
        takenFingerprints.add(fp);
      }

      let assignable = formattedRoutes.filter((r) => isRouteUnassignedForPicker(r));
      // Drop ghost duplicates: same stops as a route that is already assigned elsewhere.
      assignable = assignable.filter((r) => {
        const fp =
          reportIdsFingerprint(r.report_ids) || `id:${String(r.id)}`;
        return !takenFingerprints.has(fp);
      });

      // One assignable row per unique stop set (newest wins among remaining ghosts).
      const byFingerprint = new Map<
        string,
        (typeof formattedRoutes)[number]
      >();
      for (const r of assignable) {
        const fp =
          reportIdsFingerprint(r.report_ids) || `id:${String(r.id)}`;
        const prev = byFingerprint.get(fp);
        const t = String(r.created_at ?? "");
        const pt = String(prev?.created_at ?? "");
        if (!prev || t > pt) {
          byFingerprint.set(fp, r);
        }
      }
      formattedRoutes = Array.from(byFingerprint.values()).sort((a, b) =>
        String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
      );
    }

    return NextResponse.json(formattedRoutes, {
      status: 200,
      headers: forAssignment
        ? { "Cache-Control": "no-store, max-age=0" }
        : undefined,
    });
  } catch (err) {
    console.error("[routes:GET] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}