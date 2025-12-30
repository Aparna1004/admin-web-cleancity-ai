import { NextResponse } from "next/server";
import { getSupabaseServiceClient, getUserFromRequest } from "../../../../../lib/supabaseServer";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// POST /api/workers/:id/assign
// Assigns a route to a worker
// Body: { route_id: string, notes?: string }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, error: authError } = await getUserFromRequest(req);
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Allow if authenticated as admin/worker OR if service role key is set
    if (!user && !hasServiceKey) {
      return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });
    }

    if (user) {
      const role = (user.user_metadata?.role ?? "").toString();
      const isAdminOrWorker = role === "admin" || role === "worker";
      if (!isAdminOrWorker) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    let body: { route_id?: string; notes?: string };
    try {
      body = (await req.json()) as { route_id?: string; notes?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { route_id } = body;
    if (!route_id || typeof route_id !== "string") {
      return NextResponse.json({ error: "Missing or invalid route_id" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();

    // Verify worker exists
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id")
      .eq("id", params.id)
      .single();

    if (workerError || !worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Verify route exists
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id")
      .eq("id", route_id)
      .single();

    if (routeError) {
      // PGRST205 means table doesn't exist
      if (routeError.code === "PGRST205" || routeError.message?.includes("Could not find the table")) {
        return NextResponse.json(
          { error: "Routes table not created yet. Please create the routes table in Supabase." },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Update route with worker_id
    const { data: updatedRoute, error: updateError } = await supabase
      .from("routes")
      .update({ worker_id: params.id })
      .eq("id", route_id)
      .select()
      .single();

    if (updateError) {
      console.error("[workers/:id/assign:POST] Supabase error updating route", updateError);
      return NextResponse.json({ error: "Failed to assign route" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, route: updatedRoute }, { status: 200 });
  } catch (err) {
    console.error("[workers/:id/assign:POST] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

