import { NextResponse } from "next/server";
import { getSupabaseServiceClient, getUserFromRequest } from "../../../../../lib/supabaseServer";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// POST /api/workers/:id/assign
// :id = workers.user_id (UUID)
// Body: { route_id: string, notes?: string }
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    /* ---------- AUTH ---------- */
    const { user, error: authError } = await getUserFromRequest(req);
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!user && !hasServiceKey) {
      return NextResponse.json(
        { error: authError ?? "Unauthorized" },
        { status: 401 }
      );
    }

    if (user) {
      const role = (user.user_metadata?.role ?? "").toString();
      if (role !== "admin" && role !== "worker") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    /* ---------- BODY ---------- */
    let body: { route_id?: string; notes?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { route_id } = body;
    if (!route_id || typeof route_id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid route_id" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    /* ---------- FIND WORKER (by user_id UUID) ---------- */
    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id, user_id, zone")
      .eq("user_id", params.id) // ✅ IMPORTANT: params.id is UUID
      .single();

    if (workerError || !worker) {
      return NextResponse.json(
        { error: "Worker not found" },
        { status: 404 }
      );
    }

    /* ---------- FIND ROUTE ---------- */
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, area_id, status")
      .eq("id", route_id)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: "Route not found" },
        { status: 404 }
      );
    }

    /* ---------- OPTIONAL SAFETY CHECK ---------- */
    if (route.status === "assigned") {
      return NextResponse.json(
        { error: "Route already assigned" },
        { status: 409 }
      );
    }

    /* ---------- ASSIGN ROUTE ---------- */
    const { data: updatedRoute, error: updateError } = await supabase
      .from("routes")
      .update({
        worker_id: worker.user_id, // ✅ UUID → matches routes.worker_id
        status: "assigned",
      })
      .eq("id", route_id)
      .select()
      .single();

    if (updateError) {
      console.error(
        "[workers/:id/assign] Failed to update route",
        updateError
      );
      return NextResponse.json(
        { error: "Failed to assign route" },
        { status: 500 }
      );
    }

    /* ---------- SUCCESS ---------- */
    return NextResponse.json(
      {
        ok: true,
        route: updatedRoute,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[workers/:id/assign] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
