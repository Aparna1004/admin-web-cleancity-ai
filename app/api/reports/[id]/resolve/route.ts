import { NextResponse } from "next/server";
import {
  getSupabaseServiceClient,
  getUserFromRequest,
} from "../../../../../lib/supabaseServer";

// POST /api/reports/:id/resolve
// Body (optional): { status?: string }
// Default status = "resolved"
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    /* ================= AUTH ================= */
    const { user, error: authError } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: authError ?? "Unauthorized" },
        { status: 401 }
      );
    }

    const role = (user.user_metadata?.role ?? "").toString();
    const isAdminOrWorker = role === "admin" || role === "worker";

    if (!isAdminOrWorker) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /* ================= INPUT ================= */
    let status = "resolved";
    try {
      const body = (await req.json()) as { status?: string } | null;
      if (body?.status && typeof body.status === "string") {
        status = body.status.trim();
      }
    } catch {
      // ignore invalid JSON, use default
    }

    const supabase = getSupabaseServiceClient();

    /* ================= UPDATE REPORT ================= */
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", params.id)
      .select()
      .single();

    if (reportError) {
      console.error(
        "[reports/:id/resolve] Failed to update report",
        reportError
      );
      return NextResponse.json(
        { error: "Failed to resolve report" },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    /* ================= ROUTE COMPLETION LOGIC ================= */
    // Find route that contains this report
    const { data: route } = await supabase
      .from("routes")
      .select("id, report_ids, status")
      .contains("report_ids", [params.id])
      .single();

    if (route && Array.isArray(route.report_ids)) {
      // Check if any report in this route is NOT resolved
      const { data: pendingReports } = await supabase
        .from("reports")
        .select("id")
        .in("id", route.report_ids)
        .neq("status", "resolved");

      // If all resolved → complete route
      if (!pendingReports || pendingReports.length === 0) {
        await supabase
          .from("routes")
          .update({ status: "cleaned", attention: false })
          .eq("id", route.id);
      }
    }

    /* ================= RESPONSE ================= */
    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    console.error("[reports/:id/resolve] Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
