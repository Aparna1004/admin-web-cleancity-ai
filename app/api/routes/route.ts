import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../lib/supabaseServer";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// GET /api/routes
// Returns all routes with worker information
// 
// TODO: The routes table must be created in Supabase before this endpoint will work.
// Required schema:
//   - id (uuid, primary key)
//   - name (text)
//   - zone (text, nullable)
//   - worker_id (uuid, nullable, foreign key to workers.id)
//   - status (text, nullable)
//   - date (date/timestamp, nullable)
export async function GET() {
  try {
    const supabase = getSupabaseServiceClient();

    const { data: routes, error: routesError } = await supabase
      .from("routes")
      .select("id, name, zone, worker_id, status, date")
      .order("date", { ascending: false });

    if (routesError) {
      console.error("[routes:GET] Supabase error fetching routes", routesError);
      // PGRST205 means table doesn't exist
      if (routesError.code === "PGRST205" || routesError.message?.includes("Could not find the table")) {
        return NextResponse.json(
          { error: "Routes table not created yet. Please create the routes table in Supabase." },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
    }

    // Fetch worker names for assigned routes
    const workerIds = routes?.map((r: any) => r.worker_id).filter(Boolean) ?? [];
    let workersById: Record<string, { name: string | null }> = {};

    if (workerIds.length) {
      const { data: workersData } = await supabase
        .from("workers")
        .select("id, name")
        .in("id", workerIds);

      if (Array.isArray(workersData)) {
        workersById = workersData.reduce(
          (acc: Record<string, { name: string | null }>, w: any) => {
            acc[w.id] = { name: w.name ?? null };
            return acc;
          },
          {}
        );
      }
    }

    // Count stops per route (via route_reports or route_stops if exists)
    const routeIds = routes?.map((r: any) => r.id) ?? [];
    let stopsCount: Record<string, number> = {};

    if (routeIds.length) {
      const { data: routeReports } = await supabase
        .from("route_reports")
        .select("route_id")
        .in("route_id", routeIds);

      if (Array.isArray(routeReports)) {
        routeReports.forEach((rr: any) => {
          stopsCount[rr.route_id] = (stopsCount[rr.route_id] || 0) + 1;
        });
      }
    }

    const routesWithDetails = (routes ?? []).map((route: any) => ({
      id: route.id,
      name: route.name ?? route.id,
      zone: route.zone ?? null,
      stops: stopsCount[route.id] ?? 0,
      worker: workersById[route.worker_id]?.name ?? "Unassigned",
      worker_id: route.worker_id ?? null,
      status: route.status ?? null,
    }));

    return NextResponse.json(routesWithDetails, { status: 200 });
  } catch (err) {
    console.error("[routes:GET] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

