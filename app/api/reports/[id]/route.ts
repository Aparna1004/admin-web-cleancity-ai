import { NextResponse } from "next/server";
import { getSupabaseServiceClient, getUserFromRequest } from "../../../../lib/supabaseServer";

// PATCH /api/reports/:id
// Allows admin/worker to update severity (e.g. from ML suggestion or manual override).
// Body: { severity: "low" | "medium" | "high" }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, error: authError } = await getUserFromRequest(req);
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isAdminOrWorker =
      (user?.user_metadata?.role ?? "") === "admin" ||
      (user?.user_metadata?.role ?? "") === "worker" ||
      (!user && hasServiceRole); // allow server-side service role fallback

    if (!user && !hasServiceRole) {
      return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });
    }
    if (!isAdminOrWorker) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let payload: { severity?: string };
    try {
      payload = (await req.json()) as { severity?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const severityRaw = (payload.severity ?? "").toString().toLowerCase().trim();
    const allowed = ["low", "medium", "high"] as const;

    if (!allowed.includes(severityRaw as any)) {
      return NextResponse.json(
        { error: "Invalid severity. Expected one of: low, medium, high" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    
    // Update the report - use count: "exact" to verify affected rows
    const { data, error, count } = await supabase
      .from("reports")
      .update({ severity: severityRaw })
      .eq("id", params.id)
      .select("id", { count: "exact" });



    if (error) {
      console.error("[reports/:id:PATCH] Supabase error updating severity", error);
      // Check for RLS error (42501) or permission denied
      if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("RLS")) {
        console.error("[reports/:id:PATCH] RLS error - SERVICE_ROLE_KEY may not be configured correctly");
        return NextResponse.json({ error: "Permission denied. Check RLS policies or SERVICE_ROLE_KEY configuration." }, { status: 403 });
      }
      // PGRST116 means no rows returned
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to update report severity" }, { status: 500 });
    }

    // Check if any rows were updated using count
    if (count === 0) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(data[0], { status: 200 });
  } catch (err) {
    console.error("[reports/:id:PATCH] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/reports/:id
// Soft delete: mark attention = false (admin/worker or service role)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getUserFromRequest(req);
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isAdminOrWorker =
      user?.user_metadata?.role === "admin" ||
      user?.user_metadata?.role === "worker" ||
      (!user && hasServiceRole);

    if (!user && !hasServiceRole) {
      return NextResponse.json(
        { error: authError ?? "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isAdminOrWorker) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServiceClient();

    const { error, count } = await supabase
      .from("reports")
      .delete({ count: "exact" })   // ✅ REAL DELETE
      .eq("id", params.id);

    if (error) {
      console.error("[reports:DELETE]", error);
      return NextResponse.json(
        { error: "Failed to delete report" },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[reports:DELETE] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
