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
    const { data, error } = await supabase
      .from("reports")
      .update({ severity: severityRaw })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("[reports/:id:PATCH] Supabase error updating severity", error);
      return NextResponse.json({ error: "Failed to update report severity" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[reports/:id:PATCH] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/reports/:id
// Soft delete: mark status = 'deleted' (admin/worker or service role)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("reports")
      .update({ status: "deleted", attention: false })
      .eq("id", params.id)
      .select();

    if (error) {
      console.error("[reports/:id:DELETE] Supabase error deleting report", error);
      // If no rows match, return 404 explicitly.
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
    }

    const deleted = Array.isArray(data) ? data[0] : null;
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[reports/:id:DELETE] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

